/* eslint-disable @typescript-eslint/no-require-imports */
import { NextRequest, NextResponse } from "next/server";
import { Op } from "sequelize";
import Inventory, { type InventoryAttributes } from "./inventoryModel";
import Product from "../products/productModel";
import Category from "../productCategory/productCatetgoryModel";
import { logger } from "@/lib/logger";
import { AppError, errorResponse } from "@/lib/apiError";

const CTX = "InventoryController";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRODUCT_INCLUDE = {
  model: Product,
  as: "product",
  attributes: ["id", "productName", "dosageForm", "strength", "packSize", "unitType"],
  include: [
    {
      model: Category,
      as: "category",
      attributes: ["id", "categoryName"],
    },
  ],
};

function toNum(val: unknown): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function parsePagination(sp: URLSearchParams) {
  const page   = Math.max(1, parseInt(sp.get("page")  ?? "1"));
  const limit  = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "20")));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

// ─── GET /api/inventory ───────────────────────────────────────────────────────
// ?productId, ?status (in-stock|low-stock|out-of-stock), ?search (productName),
// ?isActive, ?page, ?limit

export async function getAllInventory(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "getAllInventory — start");

  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = parsePagination(searchParams);

    const productId  = searchParams.get("productId");
    const status     = searchParams.get("status");      // in-stock | low-stock | out-of-stock
    const isActive   = searchParams.get("isActive");
    const search     = searchParams.get("search");      // search by productName via join

    const where: Record<string, unknown> = {};
    if (productId)          where.productId = productId;
    if (isActive !== null)  where.isActive  = isActive === "true";

    // Stock status filter via SQL expression
    if (status === "out-of-stock") {
      where.quantity = { [Op.lte]: 0 };
    } else if (status === "low-stock") {
      // quantity > 0 AND quantity <= lowStockThreshold
      Object.assign(where, {
        quantity:         { [Op.gt]: 0 },
        [Op.and as symbol]: [
          { quantity: { [Op.lte]: { [Op.col]: "Inventory.lowStockThreshold" } } },
        ],
      });
    } else if (status === "in-stock") {
      Object.assign(where, {
        quantity: { [Op.gt]: { [Op.col]: "Inventory.lowStockThreshold" } },
      });
    }

    logger.debug(CTX, "getAllInventory — query", { where, page, limit, status });

    const productWhere: Record<string, unknown> = {};
    if (search) productWhere.productName = { [Op.iLike]: `%${search}%` };

    const { count, rows } = await Inventory.findAndCountAll({
      where,
      include: [{ ...PRODUCT_INCLUDE, where: Object.keys(productWhere).length ? productWhere : undefined, required: !!search }],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    // Append computed stockStatus to each row
    const data = rows.map((inv) => ({
      ...inv.toJSON(),
      stockStatus: inv.getStockStatus(),
    }));

    logger.info(CTX, `getAllInventory — ${rows.length} of ${count}`);

    return NextResponse.json({
      success: true,
      pagination: {
        total: count, page, limit,
        pages:   Math.ceil(count / limit),
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1,
      },
      data,
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getAllInventory — failed", error);
    return errorResponse(error);
  }
}

// ─── GET /api/inventory/:id ───────────────────────────────────────────────────

export async function getInventoryById(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "getInventoryById — start", { id });

  try {
    if (!id) throw new AppError("Inventory ID is required.", 400, "MISSING_ID");

    const inv = await Inventory.findByPk(id, { include: [PRODUCT_INCLUDE] });
    if (!inv) {
      logger.warn(CTX, "getInventoryById — not found", { id });
      throw new AppError("Inventory record not found.", 404, "NOT_FOUND");
    }

    logger.info(CTX, "getInventoryById — found", { id });
    return NextResponse.json({
      success: true,
      data: { ...inv.toJSON(), stockStatus: inv.getStockStatus() },
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getInventoryById — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── GET /api/inventory/product/:productId ────────────────────────────────────
// All batches for a specific product with total stock summary

export async function getInventoryByProduct(
  _req: NextRequest,
  productId: string,
): Promise<NextResponse> {
  logger.info(CTX, "getInventoryByProduct — start", { productId });

  try {
    if (!productId) throw new AppError("Product ID is required.", 400, "MISSING_ID");

    const product = await Product.findByPk(productId);
    if (!product) throw new AppError("Product not found.", 404, "PRODUCT_NOT_FOUND");

    const batches = await Inventory.findAll({
      where: { productId, isActive: true },
      order: [["expiryDate", "ASC"]], // nearest expiry first (FEFO)
    });

    const totalStock    = batches.reduce((sum, b) => sum + b.quantity, 0);
    const batchesWithStatus = batches.map((b) => ({
      ...b.toJSON(),
      stockStatus: b.getStockStatus(),
    }));

    logger.info(CTX, "getInventoryByProduct — found", { productId, batches: batches.length, totalStock });

    return NextResponse.json({
      success: true,
      data: {
        product:    { id: product.id, productName: product.productName },
        totalStock,
        batchCount: batches.length,
        batches:    batchesWithStatus,
      },
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getInventoryByProduct — failed", { productId, error });
    return errorResponse(error);
  }
}

// ─── POST /api/inventory ──────────────────────────────────────────────────────
// Add a new batch to inventory

export async function createInventory(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "createInventory — start");

  try {
    const body = await req.json();
    const {
      productId, batchNumber, quantity,
      manufacturingDate, expiryDate,
      purchasePrice, sellingPrice, mrp,
      supplierName, lowStockThreshold, isActive,
    } = body;

    logger.debug(CTX, "createInventory — payload", { productId, batchNumber, quantity });

    // Required validation
    for (const [field, val] of Object.entries({
      productId, batchNumber, quantity, manufacturingDate,
      expiryDate, purchasePrice, sellingPrice, mrp, supplierName,
    })) {
      if (val === undefined || val === null || String(val).trim() === "") {
        throw new AppError(`${field} is required.`, 400, "VALIDATION_ERROR");
      }
    }

    if (toNum(quantity) < 0) throw new AppError("quantity must be ≥ 0.", 400, "VALIDATION_ERROR");

    // Product must exist
    const product = await Product.findByPk(productId);
    if (!product) throw new AppError("Product not found.", 404, "PRODUCT_NOT_FOUND");

    // Duplicate batch check (same product + same batchNumber)
    const existing = await Inventory.findOne({ where: { productId, batchNumber: batchNumber.trim() } });
    if (existing) {
      logger.warn(CTX, "createInventory — duplicate batch", { productId, batchNumber });
      throw new AppError(
        `Batch "${batchNumber}" already exists for this product. Use the adjust-stock endpoint to update quantity.`,
        409, "DUPLICATE_BATCH",
      );
    }

    const inv = await Inventory.create({
      productId,
      batchNumber:      batchNumber.trim(),
      quantity:         toNum(quantity),
      manufacturingDate: new Date(manufacturingDate),
      expiryDate:       new Date(expiryDate),
      purchasePrice:    toNum(purchasePrice),
      sellingPrice:     toNum(sellingPrice),
      mrp:              toNum(mrp),
      supplierName:     supplierName.trim(),
      lowStockThreshold: lowStockThreshold !== undefined ? toNum(lowStockThreshold) : 10,
      isActive:         isActive !== undefined ? Boolean(isActive) : true,
    });

    const result = await Inventory.findByPk(inv.id, { include: [PRODUCT_INCLUDE] });

    logger.info(CTX, "createInventory — created", { id: inv.id, batchNumber, quantity });
    return NextResponse.json({
      success: true,
      data: { ...result!.toJSON(), stockStatus: result!.getStockStatus() },
    }, { status: 201 });
  } catch (error) {
    logger.error(CTX, "createInventory — failed", error);
    return errorResponse(error);
  }
}

// ─── PUT /api/inventory/:id ───────────────────────────────────────────────────
// Update batch details (not quantity — use adjust-stock for that)

export async function updateInventory(
  req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "updateInventory — start", { id });

  try {
    if (!id) throw new AppError("Inventory ID is required.", 400, "MISSING_ID");

    const inv = await Inventory.findByPk(id);
    if (!inv) {
      logger.warn(CTX, "updateInventory — not found", { id });
      throw new AppError("Inventory record not found.", 404, "NOT_FOUND");
    }

    const body = await req.json();
    const {
      batchNumber, manufacturingDate, expiryDate,
      purchasePrice, sellingPrice, mrp,
      supplierName, lowStockThreshold, isActive,
    } = body;

    logger.debug(CTX, "updateInventory — payload", { id, batchNumber });

    // If renaming batch, check no duplicate on same product
    if (batchNumber && batchNumber.trim() !== inv.batchNumber) {
      const dup = await Inventory.findOne({
        where: { productId: inv.productId, batchNumber: batchNumber.trim(), id: { [Op.ne]: id } },
      });
      if (dup) throw new AppError(`Batch "${batchNumber}" already exists for this product.`, 409, "DUPLICATE_BATCH");
    }

    const updates: Partial<InventoryAttributes> = {
      ...(batchNumber        != null && { batchNumber:        batchNumber.trim() }),
      ...(manufacturingDate  != null && { manufacturingDate:  new Date(manufacturingDate) }),
      ...(expiryDate         != null && { expiryDate:         new Date(expiryDate) }),
      ...(purchasePrice      != null && { purchasePrice:      toNum(purchasePrice) }),
      ...(sellingPrice       != null && { sellingPrice:       toNum(sellingPrice) }),
      ...(mrp                != null && { mrp:                toNum(mrp) }),
      ...(supplierName       != null && { supplierName:       supplierName.trim() }),
      ...(lowStockThreshold  != null && { lowStockThreshold:  toNum(lowStockThreshold) }),
      ...(isActive           != null && { isActive:           Boolean(isActive) }),
    };

    await inv.update(updates);

    const result = await Inventory.findByPk(id, { include: [PRODUCT_INCLUDE] });
    logger.info(CTX, "updateInventory — updated", { id });
    return NextResponse.json({
      success: true,
      data: { ...result!.toJSON(), stockStatus: result!.getStockStatus() },
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "updateInventory — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── POST /api/inventory/deduct ───────────────────────────────────────────────
// Called by order service on delivery confirmation.
// Deducts stock from a specific batch (FEFO: nearest expiry first if no batchId given).

export async function deductStockOnDelivery(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "deductStockOnDelivery — start");

  try {
    const body = await req.json();
    const { productId, quantity: qty, inventoryId, orderId } = body;

    logger.debug(CTX, "deductStockOnDelivery — payload", { productId, qty, inventoryId, orderId });

    if (!productId)    throw new AppError("productId is required.", 400, "VALIDATION_ERROR");
    if (!toNum(qty))   throw new AppError("quantity must be a positive number.", 400, "VALIDATION_ERROR");

    let inv: Inventory | null = null;

    if (inventoryId) {
      inv = await Inventory.findByPk(inventoryId);
      if (!inv || inv.productId !== productId) {
        throw new AppError("Inventory batch not found for this product.", 404, "NOT_FOUND");
      }
    } else {
      // Auto-select: FEFO — earliest expiry with sufficient stock
      inv = await Inventory.findOne({
        where: {
          productId,
          isActive: true,
          quantity: { [Op.gte]: toNum(qty) },
          expiryDate: { [Op.gte]: new Date() }, // not expired
        },
        order: [["expiryDate", "ASC"]],
      });
    }

    if (!inv) {
      throw new AppError(
        `Insufficient stock for product. Requested: ${qty}.`,
        400, "INSUFFICIENT_STOCK",
      );
    }

    const before = inv.quantity;
    await inv.deductStock(toNum(qty));

    logger.info(CTX, "deductStockOnDelivery — deducted", {
      inventoryId: inv.id, orderId, before, after: inv.quantity, qty,
    });

    return NextResponse.json({
      success: true,
      message: `Stock deducted: ${qty} units from batch "${inv.batchNumber}".`,
      data: {
        inventoryId: inv.id,
        batchNumber: inv.batchNumber,
        orderId:     orderId ?? null,
        before,
        after:       inv.quantity,
        stockStatus: inv.getStockStatus(),
      },
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "deductStockOnDelivery — failed", error);
    return errorResponse(error);
  }
}

// ─── POST /api/inventory/restore ──────────────────────────────────────────────
// Called by order service when an order is cancelled.
// Restores stock back to the original batch.

export async function restoreStockOnCancellation(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "restoreStockOnCancellation — start");

  try {
    const body = await req.json();
    const { inventoryId, quantity: qty, orderId } = body;

    logger.debug(CTX, "restoreStockOnCancellation — payload", { inventoryId, qty, orderId });

    if (!inventoryId) throw new AppError("inventoryId is required.", 400, "VALIDATION_ERROR");
    if (!toNum(qty))  throw new AppError("quantity must be a positive number.", 400, "VALIDATION_ERROR");

    const inv = await Inventory.findByPk(inventoryId);
    if (!inv) {
      logger.warn(CTX, "restoreStockOnCancellation — not found", { inventoryId });
      throw new AppError("Inventory batch not found.", 404, "NOT_FOUND");
    }

    const before = inv.quantity;
    await inv.restoreStock(toNum(qty));

    logger.info(CTX, "restoreStockOnCancellation — restored", {
      inventoryId, orderId, before, after: inv.quantity, qty,
    });

    return NextResponse.json({
      success: true,
      message: `Stock restored: ${qty} units to batch "${inv.batchNumber}".`,
      data: {
        inventoryId: inv.id,
        batchNumber: inv.batchNumber,
        orderId:     orderId ?? null,
        before,
        after:       inv.quantity,
        stockStatus: inv.getStockStatus(),
      },
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "restoreStockOnCancellation — failed", error);
    return errorResponse(error);
  }
}

// ─── PATCH /api/inventory/:id/toggle-active ────────────────────────────────────

export async function toggleInventoryActive(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "toggleInventoryActive — start", { id });

  try {
    if (!id) throw new AppError("Inventory ID is required.", 400, "MISSING_ID");

    const inv = await Inventory.findByPk(id);
    if (!inv) {
      logger.warn(CTX, "toggleInventoryActive — not found", { id });
      throw new AppError("Inventory record not found.", 404, "NOT_FOUND");
    }

    const previous = inv.isActive;
    await inv.update({ isActive: !previous });

    logger.info(CTX, "toggleInventoryActive — toggled", {
      id, batchNumber: inv.batchNumber, from: previous, to: inv.isActive,
    });

    return NextResponse.json({
      success: true,
      message: `Inventory batch "${inv.batchNumber}" is now ${inv.isActive ? "active" : "inactive"}.`,
      data: { id: inv.id, batchNumber: inv.batchNumber, isActive: inv.isActive },
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "toggleInventoryActive — failed", { id, error });
    return errorResponse(error);
  }
}
