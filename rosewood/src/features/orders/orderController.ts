import { NextRequest, NextResponse } from "next/server";
import { Op } from "sequelize";
import sequelize from "@/lib/database/sequelize";
import Order, { type OrderAttributes, type OrderStatus } from "./orderModel";
import OrderItem from "../orderItems/orderItemModel";
import Inventory from "../inventory/inventoryModel";
import Product from "../products/productModel";
import User from "@/lib/models/userModel";
import { logger } from "@/lib/logger";
import { AppError, errorResponse } from "@/lib/apiError";
import { sendMail } from "@/lib/email/mailer";
import { buildOrderConfirmationEmail } from "@/lib/email/templates/orderConfirmation";

const CTX = "OrderController";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const CUSTOMER_ATTRIBUTES = ["id", "name", "email"];

const ORDER_INCLUDE = [
  {
    model: User,
    as: "customer",
    attributes: CUSTOMER_ATTRIBUTES,
  },
  {
    model: OrderItem,
    as: "items",
    include: [
      {
        model: Product,
        as: "product",
        attributes: ["id", "productName", "dosageForm", "strength", "packSize", "unitType", "productImage"],
      },
    ],
  },
];

// ─── GET /api/orders ──────────────────────────────────────────────────────────
// Query params: ?customerId, ?orderStatus, ?paymentStatus, ?search (customer name/email),
//               ?dateFrom, ?dateTo, ?page, ?limit

export async function getAllOrders(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "getAllOrders — start");

  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = parsePagination(searchParams);

    const customerId    = searchParams.get("customerId");
    const orderStatus   = searchParams.get("orderStatus");
    const paymentStatus = searchParams.get("paymentStatus");
    const dateFrom      = searchParams.get("dateFrom");
    const dateTo        = searchParams.get("dateTo");
    const search        = searchParams.get("search");   // search by customer name or email

    const where: Record<string, unknown> = {};
    if (customerId)    where.customerId    = customerId;
    if (orderStatus)   where.orderStatus   = orderStatus;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    if (dateFrom || dateTo) {
      const dateRange: Record<string, Date> = {};
      if (dateFrom) dateRange[Op.gte as unknown as string] = new Date(dateFrom);
      if (dateTo)   dateRange[Op.lte as unknown as string] = new Date(dateTo);
      where.createdAt = dateRange;
    }

    logger.debug(CTX, "getAllOrders — query", { where, page, limit });

    const customerWhere: Record<string, unknown> = {};
    if (search) {
      customerWhere[Op.or as unknown as string] = [
        { name:  { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "customer",
          attributes: CUSTOMER_ATTRIBUTES,
          where: Object.keys(customerWhere).length ? customerWhere : undefined,
          required: !!search,
        },
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "productName", "dosageForm", "strength", "packSize", "unitType", "productImage"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    logger.info(CTX, `getAllOrders — ${rows.length} of ${count}`);

    return NextResponse.json({
      success: true,
      pagination: {
        total:   count,
        page,
        limit,
        pages:   Math.ceil(count / limit),
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1,
      },
      data: rows,
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getAllOrders — failed", error);
    return errorResponse(error);
  }
}

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────

export async function getOrderById(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "getOrderById — start", { id });

  try {
    if (!id) throw new AppError("Order ID is required.", 400, "MISSING_ID");

    const order = await Order.findByPk(id, { include: ORDER_INCLUDE });
    if (!order) {
      logger.warn(CTX, "getOrderById — not found", { id });
      throw new AppError("Order not found.", 404, "NOT_FOUND");
    }

    logger.info(CTX, "getOrderById — found", { id, status: order.orderStatus });
    return NextResponse.json({ success: true, data: order }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getOrderById — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── GET /api/orders/customer/:customerId ─────────────────────────────────────
// All orders for a specific customer with summary

export async function getOrdersByCustomer(
  req: NextRequest,
  customerId: string,
): Promise<NextResponse> {
  logger.info(CTX, "getOrdersByCustomer — start", { customerId });

  try {
    if (!customerId) throw new AppError("Customer ID is required.", 400, "MISSING_ID");

    const customer = await User.findByPk(customerId, { attributes: CUSTOMER_ATTRIBUTES });
    if (!customer) throw new AppError("Customer not found.", 404, "CUSTOMER_NOT_FOUND");

    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const orderStatus = searchParams.get("orderStatus");

    const where: Record<string, unknown> = { customerId };
    if (orderStatus) where.orderStatus = orderStatus;

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: ORDER_INCLUDE,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    logger.info(CTX, "getOrdersByCustomer — found", { customerId, count });

    return NextResponse.json({
      success: true,
      customer,
      pagination: {
        total:   count,
        page,
        limit,
        pages:   Math.ceil(count / limit),
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1,
      },
      data: rows,
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getOrdersByCustomer — failed", { customerId, error });
    return errorResponse(error);
  }
}

// ─── POST /api/orders ─────────────────────────────────────────────────────────
// Create a new order with its items in a single transaction.
// Stock is NOT deducted here — deduction happens on delivery (status → delivered).
//
// Body for registered customer:
// {
//   customerId, paymentMethod, deliveryAddress, deliveryNotes?,
//   items: [{ productId, inventoryId, quantity }]
// }
//
// Body for guest customer:
// {
//   isGuest: true, guestName, guestEmail, guestPhone,
//   paymentMethod, deliveryAddress, deliveryNotes?,
//   items: [{ productId, inventoryId, quantity }]
// }

export async function createOrder(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "createOrder — start");

  try {
    const body = await req.json();
    const { 
      customerId, isGuest, guestName, guestEmail, guestPhone,
      paymentMethod, deliveryAddress, deliveryNotes, items 
    } = body;

    logger.debug(CTX, "createOrder — payload", { 
      customerId, isGuest, guestEmail, paymentMethod, itemCount: items?.length 
    });

    // ── Validation ────────────────────────────────────────────────────────────
    
    // Either customerId OR guest details must be provided
    if (!isGuest && !customerId) {
      throw new AppError("customerId is required for registered customers.", 400, "VALIDATION_ERROR");
    }
    
    if (isGuest) {
      if (!guestName?.trim()) throw new AppError("guestName is required for guest orders.", 400, "VALIDATION_ERROR");
      if (!guestEmail?.trim()) throw new AppError("guestEmail is required for guest orders.", 400, "VALIDATION_ERROR");
      if (!guestPhone?.trim()) throw new AppError("guestPhone is required for guest orders.", 400, "VALIDATION_ERROR");
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(guestEmail)) {
        throw new AppError("Invalid email format.", 400, "VALIDATION_ERROR");
      }
    }
    
    if (!paymentMethod) throw new AppError("paymentMethod is required.", 400, "VALIDATION_ERROR");
    if (!deliveryAddress?.trim()) throw new AppError("deliveryAddress is required.", 400, "VALIDATION_ERROR");
    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError("items must be a non-empty array.", 400, "VALIDATION_ERROR");
    }

    const VALID_METHODS = ["cash", "card", "online", "upi"];
    if (!VALID_METHODS.includes(paymentMethod)) {
      throw new AppError(`paymentMethod must be one of: ${VALID_METHODS.join(", ")}.`, 400, "VALIDATION_ERROR");
    }

    // Customer validation (only if not guest)
    if (!isGuest) {
      const customer = await User.findByPk(customerId);
      if (!customer) throw new AppError("Customer not found.", 404, "CUSTOMER_NOT_FOUND");
    }

    // ── Resolve & validate each item ──────────────────────────────────────────
    interface ResolvedItem {
      productId: string;
      inventoryId: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
      discountRate: number;
      taxAmount: number;
      discountAmount: number;
      lineTotal: number;
      productName: string;
      batchNumber: string;
    }

    const resolvedItems: ResolvedItem[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const qty  = toNum(item.quantity);

      if (!item.productId)   throw new AppError(`items[${i}].productId is required.`,   400, "VALIDATION_ERROR");
      if (!item.inventoryId) throw new AppError(`items[${i}].inventoryId is required.`, 400, "VALIDATION_ERROR");
      if (qty < 1)           throw new AppError(`items[${i}].quantity must be ≥ 1.`,    400, "VALIDATION_ERROR");

      const inv = await Inventory.findByPk(item.inventoryId, {
        include: [{ model: Product, as: "product", attributes: ["id", "productName", "tax", "discount"] }],
      });

      if (!inv || inv.productId !== item.productId) {
        throw new AppError(
          `Inventory batch not found for product at items[${i}].`,
          404, "INVENTORY_NOT_FOUND",
        );
      }
      if (!inv.isActive) {
        throw new AppError(`Inventory batch at items[${i}] is inactive.`, 400, "BATCH_INACTIVE");
      }
      if (!inv.hasStock(qty)) {
        throw new AppError(
          `Insufficient stock for "${(inv as unknown as { product: { productName: string } }).product?.productName}". Available: ${inv.quantity}, requested: ${qty}.`,
          400, "INSUFFICIENT_STOCK",
        );
      }

      const product = await Product.findByPk(item.productId);
      if (!product) throw new AppError(`Product at items[${i}] not found.`, 404, "PRODUCT_NOT_FOUND");

      const unitPrice      = toNum(inv.sellingPrice);
      const taxRate        = toNum(product.tax);
      const discountRate   = toNum(product.discount);
      const taxAmount      = parseFloat(((unitPrice * qty * taxRate) / 100).toFixed(2));
      const discountAmount = parseFloat(((unitPrice * qty * discountRate) / 100).toFixed(2));
      const lineTotal      = parseFloat(((unitPrice * qty) + taxAmount - discountAmount).toFixed(2));

      resolvedItems.push({
        productId:      item.productId,
        inventoryId:    item.inventoryId,
        quantity:       qty,
        unitPrice,
        taxRate,
        discountRate,
        taxAmount,
        discountAmount,
        lineTotal,
        productName:    product.productName,
        batchNumber:    inv.batchNumber,
      });
    }

    // ── Compute order totals ──────────────────────────────────────────────────
    const subtotal       = parseFloat(resolvedItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0).toFixed(2));
    const totalTax       = parseFloat(resolvedItems.reduce((s, i) => s + i.taxAmount, 0).toFixed(2));
    const totalDiscount  = parseFloat(resolvedItems.reduce((s, i) => s + i.discountAmount, 0).toFixed(2));
    const totalAmount    = parseFloat(resolvedItems.reduce((s, i) => s + i.lineTotal, 0).toFixed(2));

    logger.debug(CTX, "createOrder — totals", { subtotal, totalTax, totalDiscount, totalAmount });

    // ── Persist in a transaction ──────────────────────────────────────────────
    const order = await sequelize.transaction(async (t) => {
      const baseOrderData = {
        paymentMethod,
        deliveryAddress: deliveryAddress.trim(),
        deliveryNotes:   deliveryNotes?.trim() ?? null,
        subtotal,
        taxAmount:       totalTax,
        discountAmount:  totalDiscount,
        totalAmount,
        orderStatus:   "pending" as const,
        paymentStatus: "unpaid" as const,
      };
      
      const orderData = isGuest
        ? {
            ...baseOrderData,
            isGuest: true,
            customerId: null,
            guestName: guestName.trim(),
            guestEmail: guestEmail.trim().toLowerCase(),
            guestPhone: guestPhone.trim(),
          }
        : {
            ...baseOrderData,
            isGuest: false,
            customerId,
          };

      const newOrder = await Order.create(orderData, { transaction: t });

      await OrderItem.bulkCreate(
        resolvedItems.map((item) => ({ ...item, orderId: newOrder.id })),
        { transaction: t, validate: true },
      );

      return newOrder;
    });

    const result = await Order.findByPk(order.id, { include: ORDER_INCLUDE });

    logger.info(CTX, "createOrder — created", {
      id: order.id, 
      isGuest: order.isGuest,
      customerId: order.customerId, 
      itemCount: resolvedItems.length, 
      totalAmount,
    });

    // ── Send confirmation email (fire-and-forget — don't block response) ──────
    const recipientEmail = order.isGuest
      ? order.guestEmail
      : (result as Order & { customer?: { email: string } })?.customer?.email ?? null;

    const recipientName = order.isGuest
      ? order.guestName ?? "Customer"
      : (result as Order & { customer?: { name: string } })?.customer?.name ?? "Customer";

    if (recipientEmail) {
      const emailData = {
        orderId:         order.id,
        customerName:    recipientName,
        customerEmail:   recipientEmail,
        isGuest:         order.isGuest,
        orderStatus:     order.orderStatus,
        paymentMethod:   order.paymentMethod,
        paymentStatus:   order.paymentStatus,
        deliveryAddress: order.deliveryAddress,
        subtotal,
        taxAmount:       totalTax,
        discountAmount:  totalDiscount,
        totalAmount,
        items:           resolvedItems.map(i => ({
          productName: i.productName,
          quantity:    i.quantity,
          unitPrice:   i.unitPrice,
          lineTotal:   i.lineTotal,
        })),
        createdAt: order.createdAt ?? new Date(),
      };

      const { subject, html, text } = buildOrderConfirmationEmail(emailData);
      sendMail({ to: recipientEmail, subject, html, text }).catch(err =>
        logger.error(CTX, "createOrder — email failed", err)
      );
    } else {
      logger.warn(CTX, "createOrder — no email address to send confirmation", { id: order.id });
    }

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    logger.error(CTX, "createOrder — failed", error);
    return errorResponse(error);
  }
}

// ─── PATCH /api/orders/:id/status ─────────────────────────────────────────────
// Update order status with transition validation.
// When status → "delivered": deducts stock from each batch automatically.
// When status → "cancelled": restores stock to each batch automatically.
//
// Body: { status, cancellationReason? }

export async function updateOrderStatus(
  req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "updateOrderStatus — start", { id });

  try {
    if (!id) throw new AppError("Order ID is required.", 400, "MISSING_ID");

    const body = await req.json();
    const { status, cancellationReason } = body;

    logger.debug(CTX, "updateOrderStatus — payload", { id, status });

    const VALID_STATUSES: OrderStatus[] = [
      "pending", "confirmed", "processing", "shipped", "delivered", "cancelled",
    ];
    if (!VALID_STATUSES.includes(status)) {
      throw new AppError(`status must be one of: ${VALID_STATUSES.join(", ")}.`, 400, "VALIDATION_ERROR");
    }

    const order = await Order.findByPk(id, {
      include: [{ model: OrderItem, as: "items" }],
    });

    if (!order) {
      logger.warn(CTX, "updateOrderStatus — not found", { id });
      throw new AppError("Order not found.", 404, "NOT_FOUND");
    }

    if (!order.canTransitionTo(status as OrderStatus)) {
      // Log the forced transition for audit purposes but allow admin override
      logger.warn(CTX, "updateOrderStatus — forced transition (admin override)", {
        id, from: order.orderStatus, to: status,
      });
    }

    const items = (order as Order & { items: OrderItem[] }).items ?? [];

    // ── Deliver: deduct stock from each batch ─────────────────────────────────
    if (status === "delivered") {
      if (order.paymentStatus !== "paid") {
        throw new AppError(
          "Cannot mark order as delivered — payment not confirmed.",
          400, "PAYMENT_REQUIRED",
        );
      }

      await sequelize.transaction(async (t) => {
        for (const item of items) {
          const inv = await Inventory.findByPk(item.inventoryId, { transaction: t });
          if (!inv) {
            throw new AppError(
              `Inventory batch not found for item "${item.productName}".`,
              404, "INVENTORY_NOT_FOUND",
            );
          }
          if (!inv.hasStock(item.quantity)) {
            throw new AppError(
              `Insufficient stock for "${item.productName}". Available: ${inv.quantity}, needed: ${item.quantity}.`,
              400, "INSUFFICIENT_STOCK",
            );
          }
          await inv.update({ quantity: inv.quantity - item.quantity }, { transaction: t });
        }

        await order.update(
          { orderStatus: "delivered", deliveredAt: new Date() },
          { transaction: t },
        );
      });

      logger.info(CTX, "updateOrderStatus — delivered + stock deducted", { id });
    }

    // ── Cancel: restore stock if order was confirmed/processing/shipped ────────
    else if (status === "cancelled") {
      const stockBearingStatuses: OrderStatus[] = ["confirmed", "processing", "shipped"];
      const shouldRestoreStock = stockBearingStatuses.includes(order.orderStatus);

      await sequelize.transaction(async (t) => {
        if (shouldRestoreStock) {
          for (const item of items) {
            const inv = await Inventory.findByPk(item.inventoryId, { transaction: t });
            if (inv) {
              await inv.update({ quantity: inv.quantity + item.quantity }, { transaction: t });
            }
          }
        }

        const cancelUpdates: Partial<OrderAttributes> = {
          orderStatus:        "cancelled",
          cancelledAt:        new Date(),
          cancellationReason: cancellationReason?.trim() ?? null,
        };

        // Refund if already paid
        if (order.paymentStatus === "paid") {
          cancelUpdates.paymentStatus = "refunded";
        }

        await order.update(cancelUpdates, { transaction: t });
      });

      logger.info(CTX, "updateOrderStatus — cancelled", {
        id, stockRestored: shouldRestoreStock, reason: cancellationReason,
      });
    }

    // ── Other transitions ──────────────────────────────────────────────────────
    else {
      const timestampField: Partial<Record<OrderStatus, keyof OrderAttributes>> = {
        confirmed:  "confirmedAt",
        shipped:    "shippedAt",
      };

      const updates: Partial<OrderAttributes> = { orderStatus: status as OrderStatus };
      const tsField = timestampField[status as OrderStatus];
      if (tsField) (updates as Record<string, unknown>)[tsField] = new Date();

      await order.update(updates);

      logger.info(CTX, "updateOrderStatus — updated", { id, status });
    }

    const result = await Order.findByPk(id, { include: ORDER_INCLUDE });

    return NextResponse.json({
      success: true,
      message: `Order status updated to "${status}".`,
      data: result,
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "updateOrderStatus — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── PATCH /api/orders/:id/payment ────────────────────────────────────────────
// Update payment status.
// Body: { paymentStatus: "paid" | "unpaid" | "refunded" }

export async function updatePaymentStatus(
  req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "updatePaymentStatus — start", { id });

  try {
    if (!id) throw new AppError("Order ID is required.", 400, "MISSING_ID");

    const body = await req.json();
    const { paymentStatus } = body;

    const VALID = ["unpaid", "paid", "refunded"];
    if (!VALID.includes(paymentStatus)) {
      throw new AppError(`paymentStatus must be one of: ${VALID.join(", ")}.`, 400, "VALIDATION_ERROR");
    }

    const order = await Order.findByPk(id);
    if (!order) {
      logger.warn(CTX, "updatePaymentStatus — not found", { id });
      throw new AppError("Order not found.", 404, "NOT_FOUND");
    }

    if (order.orderStatus === "cancelled") {
      throw new AppError("Cannot update payment on a cancelled order.", 400, "ORDER_CANCELLED");
    }

    const previous = order.paymentStatus;
    await order.update({ paymentStatus });

    logger.info(CTX, "updatePaymentStatus — updated", {
      id, from: previous, to: paymentStatus,
    });

    return NextResponse.json({
      success: true,
      message: `Payment status updated to "${paymentStatus}".`,
      data: { id: order.id, paymentStatus: order.paymentStatus, orderStatus: order.orderStatus },
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "updatePaymentStatus — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── GET /api/orders/stats ────────────────────────────────────────────────────
// Summary stats for admin dashboard.
// ?dateFrom, ?dateTo

export async function getOrderStats(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "getOrderStats — start");

  try {
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo   = searchParams.get("dateTo");

    const where: Record<string, unknown> = {};
    if (dateFrom || dateTo) {
      const dateRange: Record<string, Date> = {};
      if (dateFrom) dateRange[Op.gte as unknown as string] = new Date(dateFrom);
      if (dateTo)   dateRange[Op.lte as unknown as string] = new Date(dateTo);
      where.createdAt = dateRange;
    }

    const [total, pending, confirmed, processing, shipped, delivered, cancelled] =
      await Promise.all([
        Order.count({ where }),
        Order.count({ where: { ...where, orderStatus: "pending" } }),
        Order.count({ where: { ...where, orderStatus: "confirmed" } }),
        Order.count({ where: { ...where, orderStatus: "processing" } }),
        Order.count({ where: { ...where, orderStatus: "shipped" } }),
        Order.count({ where: { ...where, orderStatus: "delivered" } }),
        Order.count({ where: { ...where, orderStatus: "cancelled" } }),
      ]);

    // Total revenue from delivered + paid orders
    const revenueResult = await Order.findAll({
      where: { ...where, orderStatus: "delivered", paymentStatus: "paid" },
      attributes: [
        [sequelize.fn("SUM", sequelize.col("totalAmount")), "totalRevenue"],
        [sequelize.fn("AVG", sequelize.col("totalAmount")), "avgOrderValue"],
      ],
      raw: true,
    }) as unknown as Array<{ totalRevenue: string | null; avgOrderValue: string | null }>;

    const totalRevenue  = parseFloat(revenueResult[0]?.totalRevenue  ?? "0") || 0;
    const avgOrderValue = parseFloat(revenueResult[0]?.avgOrderValue ?? "0") || 0;

    logger.info(CTX, "getOrderStats — done", { total, totalRevenue });

    return NextResponse.json({
      success: true,
      data: {
        total,
        byStatus: { pending, confirmed, processing, shipped, delivered, cancelled },
        revenue: {
          total:    parseFloat(totalRevenue.toFixed(2)),
          avgOrder: parseFloat(avgOrderValue.toFixed(2)),
        },
      },
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getOrderStats — failed", error);
    return errorResponse(error);
  }
}
