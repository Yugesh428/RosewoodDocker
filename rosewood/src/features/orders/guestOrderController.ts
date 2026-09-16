import { NextRequest, NextResponse } from "next/server";
import Order from "./orderModel";
import OrderItem from "../orderItems/orderItemModel";
import Product from "../products/productModel";
import { logger } from "@/lib/logger";
import { AppError, errorResponse } from "@/lib/apiError";

const CTX = "GuestOrderController";

const ORDER_INCLUDE = [
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

// ─── POST /api/orders/guest/track ─────────────────────────────────────────────
// Guest order tracking - verify email + orderId to view order details
//
// Body: { orderId, email }

export async function trackGuestOrder(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "trackGuestOrder — start");

  try {
    const body = await req.json();
    const { orderId, email } = body;

    logger.debug(CTX, "trackGuestOrder — payload", { orderId, email });

    // Validation
    if (!orderId?.trim()) {
      throw new AppError("orderId is required.", 400, "VALIDATION_ERROR");
    }
    if (!email?.trim()) {
      throw new AppError("email is required.", 400, "VALIDATION_ERROR");
    }

    // Find order by ID
    const order = await Order.findByPk(orderId, { include: ORDER_INCLUDE });

    if (!order) {
      logger.warn(CTX, "trackGuestOrder — order not found", { orderId });
      throw new AppError("Order not found.", 404, "NOT_FOUND");
    }

    // Verify this is a guest order
    if (!order.isGuest) {
      logger.warn(CTX, "trackGuestOrder — not a guest order", { orderId });
      throw new AppError("This is not a guest order. Please login to view order details.", 400, "NOT_GUEST_ORDER");
    }

    // Verify email matches
    if (order.guestEmail?.toLowerCase() !== email.toLowerCase().trim()) {
      logger.warn(CTX, "trackGuestOrder — email mismatch", { orderId, providedEmail: email });
      throw new AppError("Email does not match order records.", 403, "EMAIL_MISMATCH");
    }

    logger.info(CTX, "trackGuestOrder — found", { orderId, email });

    return NextResponse.json({ success: true, data: order }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "trackGuestOrder — failed", error);
    return errorResponse(error);
  }
}

// ─── PATCH /api/orders/guest/:orderId/cancel ──────────────────────────────────
// Guest order cancellation - verify email before cancelling
//
// Body: { email, cancellationReason? }

export async function cancelGuestOrder(
  req: NextRequest,
  orderId: string,
): Promise<NextResponse> {
  logger.info(CTX, "cancelGuestOrder — start", { orderId });

  try {
    if (!orderId) throw new AppError("Order ID is required.", 400, "MISSING_ID");

    const body = await req.json();
    const { email, cancellationReason } = body;

    if (!email?.trim()) {
      throw new AppError("email is required.", 400, "VALIDATION_ERROR");
    }

    // Find order
    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderItem, as: "items" }],
    });

    if (!order) {
      logger.warn(CTX, "cancelGuestOrder — order not found", { orderId });
      throw new AppError("Order not found.", 404, "NOT_FOUND");
    }

    // Verify this is a guest order
    if (!order.isGuest) {
      logger.warn(CTX, "cancelGuestOrder — not a guest order", { orderId });
      throw new AppError("This is not a guest order.", 400, "NOT_GUEST_ORDER");
    }

    // Verify email matches
    if (order.guestEmail?.toLowerCase() !== email.toLowerCase().trim()) {
      logger.warn(CTX, "cancelGuestOrder — email mismatch", { orderId });
      throw new AppError("Email does not match order records.", 403, "EMAIL_MISMATCH");
    }

    // Check if order can be cancelled
    if (!order.canTransitionTo("cancelled")) {
      throw new AppError(
        `Cannot cancel order with status "${order.orderStatus}". Only pending or confirmed orders can be cancelled.`,
        400,
        "INVALID_TRANSITION",
      );
    }

    // Cancel the order
    const cancelUpdates = {
      orderStatus: "cancelled" as const,
      cancelledAt: new Date(),
      cancellationReason: cancellationReason?.trim() ?? "Cancelled by customer",
    };

    // Refund if already paid
    if (order.paymentStatus === "paid") {
      (cancelUpdates as Record<string, unknown>).paymentStatus = "refunded";
    }

    await order.update(cancelUpdates);

    logger.info(CTX, "cancelGuestOrder — cancelled", { orderId, reason: cancellationReason });

    const result = await Order.findByPk(orderId, { include: ORDER_INCLUDE });

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully.",
      data: result,
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "cancelGuestOrder — failed", { orderId, error });
    return errorResponse(error);
  }
}
