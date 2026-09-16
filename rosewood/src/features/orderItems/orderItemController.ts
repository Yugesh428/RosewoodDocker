import { NextRequest, NextResponse } from "next/server";
import sequelize from "@/lib/database/sequelize";
import OrderItem from "./orderItemModel";
import Order from "../orders/orderModel";
import Product from "../products/productModel";
import Inventory from "../inventory/inventoryModel";
import { logger } from "@/lib/logger";
import { AppError, errorResponse } from "@/lib/apiError";

const CTX = "OrderItemController";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toNum(val: unknown): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

// Standard includes reused across all reads
const ITEM_INCLUDE = [
  {
    model: Product,
    as: "product",
    attributes: ["id", "productName", "dosageForm", "strength", "packSize", "unitType", "productImage"],
  },
  {
    model: Inventory,
    as: "inventory",
    attributes: ["id", "batchNumber", "expiryDate", "quantity", "sellingPrice"],
  },
];

// ─── Helpers: recalculate order totals after item mutation ────────────────────

async function syncOrderTotals(
  orderId: string,
  transaction?: Parameters<typeof sequelize.transaction>[0] extends (t: infer T) => unknown ? T : never,
): Promise<void> {
  const items = await OrderItem.findAll({
    where: { orderId },
    ...(transaction ? { transaction } : {}),
  });

  const subtotal      = parseFloat(items.reduce((s, i) => s + toNum(i.unitPrice) * i.quantity, 0).toFixed(2));
  const taxAmount     = parseFloat(items.reduce((s, i) => s + toNum(i.taxAmount), 0).toFixed(2));
  const discountAmount = parseFloat(items.reduce((s, i) => s + toNum(i.discountAmount), 0).toFixed(2));
  const totalAmount   = parseFloat(items.reduce((s, i) => s + toNum(i.lineTotal), 0).toFixed(2));

  await Order.update(
    { subtotal, taxAmount, discountAmount, totalAmount },
    {
      where: { id: orderId },
      ...(transaction ? { transaction } : {}),
    },
  );
}

// ─── GET /api/order-items?orderId=xxx ─────────────────────────────────────────
// List all items for a given order. orderId is required as a query param.

export async function getItemsByOrder(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "getItemsByOrder — start");

  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) throw new AppError("orderId query param is required.", 400, "MISSING_PARAM");

    const order = await Order.findByPk(orderId, { attributes: ["id", "orderStatus"] });
    if (!order) throw new AppError("Order not found.", 404, "ORDER_NOT_FOUND");

    const items = await OrderItem.findAll({
      where: { orderId },
      include: ITEM_INCLUDE,
      order: [["createdAt", "ASC"]],
    });

    logger.info(CTX, `getItemsByOrder — ${items.length} items`, { orderId });

    return NextResponse.json({
      success: true,
      orderId,
      orderStatus: order.orderStatus,
      count: items.length,
      data: items,
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getItemsByOrder — failed", error);
    return errorResponse(error);
  }
}

// ─── GET /api/order-items/:id ─────────────────────────────────────────────────

export async function getOrderItemById(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "getOrderItemById — start", { id });

  try {
    if (!id) throw new AppError("Order item ID is required.", 400, "MISSING_ID");

    const item = await OrderItem.findByPk(id, { include: ITEM_INCLUDE });
    if (!item) {
      logger.warn(CTX, "getOrderItemById — not found", { id });
      throw new AppError("Order item not found.", 404, "NOT_FOUND");
    }

    logger.info(CTX, "getOrderItemById — found", { id, orderId: item.orderId });
    return NextResponse.json({ success: true, data: item }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getOrderItemById — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── POST /api/order-items ────────────────────────────────────────────────────
// Add a new item to an existing order.
// Only allowed when order is still "pending".
// Validates stock availability before adding.
//
// Body: { orderId, productId, inventoryId, quantity }

export async function addOrderItem(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "addOrderItem — start");

  try {
    const body = await req.json();
    const { orderId, productId, inventoryId, quantity } = body;

    logger.debug(CTX, "addOrderItem — payload", { orderId, productId, inventoryId, quantity });

    // ── Validation ────────────────────────────────────────────────────────────
    if (!orderId)     throw new AppError("orderId is required.",     400, "VALIDATION_ERROR");
    if (!productId)   throw new AppError("productId is required.",   400, "VALIDATION_ERROR");
    if (!inventoryId) throw new AppError("inventoryId is required.", 400, "VALIDATION_ERROR");

    const qty = toNum(quantity);
    if (qty < 1) throw new AppError("quantity must be ≥ 1.", 400, "VALIDATION_ERROR");

    // ── Order must exist and be pending ───────────────────────────────────────
    const order = await Order.findByPk(orderId);
    if (!order) throw new AppError("Order not found.", 404, "ORDER_NOT_FOUND");
    if (order.orderStatus !== "pending") {
      throw new AppError(
        `Items can only be added to a "pending" order. Current status: "${order.orderStatus}".`,
        400, "ORDER_NOT_EDITABLE",
      );
    }

    // ── Product & inventory validation ────────────────────────────────────────
    const product = await Product.findByPk(productId);
    if (!product) throw new AppError("Product not found.", 404, "PRODUCT_NOT_FOUND");

    const inv = await Inventory.findByPk(inventoryId);
    if (!inv || inv.productId !== productId) {
      throw new AppError("Inventory batch not found for this product.", 404, "INVENTORY_NOT_FOUND");
    }
    if (!inv.isActive) {
      throw new AppError("Inventory batch is inactive.", 400, "BATCH_INACTIVE");
    }
    if (!inv.hasStock(qty)) {
      throw new AppError(
        `Insufficient stock for "${product.productName}". Available: ${inv.quantity}, requested: ${qty}.`,
        400, "INSUFFICIENT_STOCK",
      );
    }

    // ── Duplicate item check (same product + batch in same order) ─────────────
    const duplicate = await OrderItem.findOne({ where: { orderId, productId, inventoryId } });
    if (duplicate) {
      throw new AppError(
        `"${product.productName}" from this batch is already in the order. Use PATCH /:id/quantity to update the quantity.`,
        409, "DUPLICATE_ITEM",
      );
    }

    // ── Compute line amounts ──────────────────────────────────────────────────
    const unitPrice      = toNum(inv.sellingPrice);
    const taxRate        = toNum(product.tax);
    const discountRate   = toNum(product.discount);
    const taxAmount      = parseFloat(((unitPrice * qty * taxRate) / 100).toFixed(2));
    const discountAmount = parseFloat(((unitPrice * qty * discountRate) / 100).toFixed(2));
    const lineTotal      = parseFloat(((unitPrice * qty) + taxAmount - discountAmount).toFixed(2));

    logger.debug(CTX, "addOrderItem — computed", { unitPrice, taxRate, discountRate, lineTotal });

    // ── Persist item + sync order totals in transaction ───────────────────────
    const newItem = await sequelize.transaction(async (t) => {
      const item = await OrderItem.create(
        {
          orderId,
          productId,
          inventoryId,
          quantity:     qty,
          unitPrice,
          taxRate,
          discountRate,
          taxAmount,
          discountAmount,
          lineTotal,
          productName:  product.productName,
          batchNumber:  inv.batchNumber,
        },
        { transaction: t },
      );

      await syncOrderTotals(orderId, t as never);

      return item;
    });

    const result = await OrderItem.findByPk(newItem.id, { include: ITEM_INCLUDE });

    logger.info(CTX, "addOrderItem — added", {
      itemId: newItem.id, orderId, productId, qty, lineTotal,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    logger.error(CTX, "addOrderItem — failed", error);
    return errorResponse(error);
  }
}

// ─── PATCH /api/order-items/:id/quantity ──────────────────────────────────────
// Update quantity on an existing order item.
// Only allowed when order is "pending".
// Re-computes taxAmount, discountAmount, lineTotal and syncs order totals.
//
// Body: { quantity }

export async function updateOrderItemQuantity(
  req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "updateOrderItemQuantity — start", { id });

  try {
    if (!id) throw new AppError("Order item ID is required.", 400, "MISSING_ID");

    const item = await OrderItem.findByPk(id);
    if (!item) {
      logger.warn(CTX, "updateOrderItemQuantity — not found", { id });
      throw new AppError("Order item not found.", 404, "NOT_FOUND");
    }

    const order = await Order.findByPk(item.orderId);
    if (!order) throw new AppError("Parent order not found.", 404, "ORDER_NOT_FOUND");

    if (order.orderStatus !== "pending") {
      throw new AppError(
        `Item quantity can only be changed on a "pending" order. Current status: "${order.orderStatus}".`,
        400, "ORDER_NOT_EDITABLE",
      );
    }

    const body = await req.json();
    const qty  = toNum(body.quantity);

    if (qty < 1) throw new AppError("quantity must be ≥ 1.", 400, "VALIDATION_ERROR");

    // Stock check against the batch
    const inv = await Inventory.findByPk(item.inventoryId);
    if (!inv) throw new AppError("Inventory batch no longer exists.", 404, "INVENTORY_NOT_FOUND");

    if (!inv.hasStock(qty)) {
      throw new AppError(
        `Insufficient stock for "${item.productName}". Available: ${inv.quantity}, requested: ${qty}.`,
        400, "INSUFFICIENT_STOCK",
      );
    }

    // Re-compute line amounts
    const unitPrice      = toNum(item.unitPrice);
    const taxRate        = toNum(item.taxRate);
    const discountRate   = toNum(item.discountRate);
    const taxAmount      = parseFloat(((unitPrice * qty * taxRate) / 100).toFixed(2));
    const discountAmount = parseFloat(((unitPrice * qty * discountRate) / 100).toFixed(2));
    const lineTotal      = parseFloat(((unitPrice * qty) + taxAmount - discountAmount).toFixed(2));

    logger.debug(CTX, "updateOrderItemQuantity — recomputed", {
      id, qty, unitPrice, taxAmount, discountAmount, lineTotal,
    });

    await sequelize.transaction(async (t) => {
      await item.update(
        { quantity: qty, taxAmount, discountAmount, lineTotal },
        { transaction: t },
      );
      await syncOrderTotals(item.orderId, t as never);
    });

    const result = await OrderItem.findByPk(id, { include: ITEM_INCLUDE });

    logger.info(CTX, "updateOrderItemQuantity — updated", { id, qty, lineTotal });

    return NextResponse.json({
      success: true,
      message: `Quantity updated to ${qty}.`,
      data: result,
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "updateOrderItemQuantity — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── DELETE /api/order-items/:id ──────────────────────────────────────────────
// Remove an item from a pending order.
// Syncs order totals after removal.
// Prevents deletion if it is the last item (order must have at least 1 item).

export async function removeOrderItem(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "removeOrderItem — start", { id });

  try {
    if (!id) throw new AppError("Order item ID is required.", 400, "MISSING_ID");

    const item = await OrderItem.findByPk(id);
    if (!item) {
      logger.warn(CTX, "removeOrderItem — not found", { id });
      throw new AppError("Order item not found.", 404, "NOT_FOUND");
    }

    const order = await Order.findByPk(item.orderId);
    if (!order) throw new AppError("Parent order not found.", 404, "ORDER_NOT_FOUND");

    if (order.orderStatus !== "pending") {
      throw new AppError(
        `Items can only be removed from a "pending" order. Current status: "${order.orderStatus}".`,
        400, "ORDER_NOT_EDITABLE",
      );
    }

    // Guard: must have at least 1 item remaining
    const itemCount = await OrderItem.count({ where: { orderId: item.orderId } });
    if (itemCount <= 1) {
      throw new AppError(
        "Cannot remove the last item from an order. Cancel the order instead.",
        400, "LAST_ITEM",
      );
    }

    const { orderId, productName } = item;

    await sequelize.transaction(async (t) => {
      await item.destroy({ transaction: t });
      await syncOrderTotals(orderId, t as never);
    });

    logger.info(CTX, "removeOrderItem — removed", { id, orderId, productName });

    return NextResponse.json({
      success: true,
      message: `"${productName}" removed from order.`,
      data: { id, orderId },
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "removeOrderItem — failed", { id, error });
    return errorResponse(error);
  }
}
