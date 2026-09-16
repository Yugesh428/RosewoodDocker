import { NextRequest, NextResponse } from "next/server";
import { Op, type Includeable } from "sequelize";
import GuestCart from "./guestCartModel";
import Product from "../products/productModel";
import Inventory from "../inventory/inventoryModel";
import { logger } from "@/lib/logger";
import { AppError, errorResponse } from "@/lib/apiError";

const CTX = "GuestCartController";

const CART_INCLUDE: Includeable[] = [
  {
    model: Product,
    as: "product",
    attributes: ["id", "productName", "dosageForm", "strength", "packSize", "unitType", "productImage", "sellingPrice", "originalPrice", "tax", "discount"],
  },
  {
    model: Inventory,
    as: "inventory",
    attributes: ["id", "batchNumber", "quantity", "sellingPrice", "expiryDate", "isActive"],
  },
];

function toNum(val: unknown): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

// ─── GET /api/guest-cart/:sessionId ───────────────────────────────────────────
// Get all cart items for a guest session

export async function getGuestCart(
  _req: NextRequest,
  sessionId: string,
): Promise<NextResponse> {
  logger.info(CTX, "getGuestCart — start", { sessionId });

  try {
    if (!sessionId?.trim()) {
      throw new AppError("sessionId is required.", 400, "MISSING_SESSION_ID");
    }

    // Delete expired items first
    await GuestCart.destroy({
      where: {
        expiresAt: { [Op.lt]: new Date() },
      },
    });

    const cartItems = await GuestCart.findAll({
      where: { sessionId: sessionId.trim() },
      include: CART_INCLUDE,
      order: [["createdAt", "ASC"]],
    });

    logger.info(CTX, "getGuestCart — found", { sessionId, count: cartItems.length });

    return NextResponse.json({
      success: true,
      data: cartItems,
      summary: {
        itemCount: cartItems.length,
        totalQuantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      },
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getGuestCart — failed", { sessionId, error });
    return errorResponse(error);
  }
}

// ─── POST /api/guest-cart ─────────────────────────────────────────────────────
// Add item to guest cart
//
// Body: { sessionId, productId, inventoryId, quantity }

export async function addToGuestCart(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "addToGuestCart — start");

  try {
    const body = await req.json();
    const { sessionId, productId, inventoryId, quantity } = body;

    logger.debug(CTX, "addToGuestCart — payload", { sessionId, productId, inventoryId, quantity });

    // Validation
    if (!sessionId?.trim()) throw new AppError("sessionId is required.", 400, "VALIDATION_ERROR");
    if (!productId?.trim()) throw new AppError("productId is required.", 400, "VALIDATION_ERROR");
    if (!inventoryId?.trim()) throw new AppError("inventoryId is required.", 400, "VALIDATION_ERROR");

    const qty = toNum(quantity);
    if (qty < 1) throw new AppError("quantity must be at least 1.", 400, "VALIDATION_ERROR");

    // Verify product exists
    const product = await Product.findByPk(productId);
    if (!product) throw new AppError("Product not found.", 404, "PRODUCT_NOT_FOUND");

    // Verify inventory exists and has stock
    const inventory = await Inventory.findByPk(inventoryId);
    if (!inventory) throw new AppError("Inventory batch not found.", 404, "INVENTORY_NOT_FOUND");
    if (inventory.productId !== productId) {
      throw new AppError("Inventory batch does not match product.", 400, "INVENTORY_MISMATCH");
    }
    if (!inventory.isActive) {
      throw new AppError("Inventory batch is inactive.", 400, "BATCH_INACTIVE");
    }

    // Check if item already exists in cart
    const existing = await GuestCart.findOne({
      where: { sessionId: sessionId.trim(), productId },
    });

    let cartItem: GuestCart;

    if (existing) {
      // Update quantity
      const newQty = existing.quantity + qty;
      
      if (!inventory.hasStock(newQty)) {
        throw new AppError(
          `Insufficient stock. Available: ${inventory.quantity}, requested: ${newQty}.`,
          400,
          "INSUFFICIENT_STOCK",
        );
      }

      await existing.update({
        quantity: newQty,
        inventoryId, // Update to latest inventory batch if different
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Reset expiry
      });
      cartItem = existing;
      logger.info(CTX, "addToGuestCart — updated existing", { id: existing.id, newQty });
    } else {
      // Create new cart item
      if (!inventory.hasStock(qty)) {
        throw new AppError(
          `Insufficient stock. Available: ${inventory.quantity}, requested: ${qty}.`,
          400,
          "INSUFFICIENT_STOCK",
        );
      }

      cartItem = await GuestCart.create({
        sessionId: sessionId.trim(),
        productId,
        inventoryId,
        quantity: qty,
      });
      logger.info(CTX, "addToGuestCart — created", { id: cartItem.id });
    }

    const result = await GuestCart.findByPk(cartItem.id, { include: CART_INCLUDE });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    logger.error(CTX, "addToGuestCart — failed", error);
    return errorResponse(error);
  }
}

// ─── PATCH /api/guest-cart/:id/quantity ───────────────────────────────────────
// Update cart item quantity
//
// Body: { quantity }

export async function updateGuestCartQuantity(
  req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "updateGuestCartQuantity — start", { id });

  try {
    if (!id) throw new AppError("Cart item ID is required.", 400, "MISSING_ID");

    const body = await req.json();
    const { quantity } = body;

    const qty = toNum(quantity);
    if (qty < 1) throw new AppError("quantity must be at least 1.", 400, "VALIDATION_ERROR");

    const cartItem = await GuestCart.findByPk(id);
    if (!cartItem) {
      logger.warn(CTX, "updateGuestCartQuantity — not found", { id });
      throw new AppError("Cart item not found.", 404, "NOT_FOUND");
    }

    // Check stock availability
    const inventory = await Inventory.findByPk(cartItem.inventoryId);
    if (!inventory) throw new AppError("Inventory batch not found.", 404, "INVENTORY_NOT_FOUND");

    if (!inventory.hasStock(qty)) {
      throw new AppError(
        `Insufficient stock. Available: ${inventory.quantity}, requested: ${qty}.`,
        400,
        "INSUFFICIENT_STOCK",
      );
    }

    await cartItem.update({ quantity: qty });

    const result = await GuestCart.findByPk(id, { include: CART_INCLUDE });

    logger.info(CTX, "updateGuestCartQuantity — updated", { id, qty });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "updateGuestCartQuantity — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── DELETE /api/guest-cart/:id ───────────────────────────────────────────────
// Remove item from guest cart

export async function removeFromGuestCart(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "removeFromGuestCart — start", { id });

  try {
    if (!id) throw new AppError("Cart item ID is required.", 400, "MISSING_ID");

    const cartItem = await GuestCart.findByPk(id);
    if (!cartItem) {
      logger.warn(CTX, "removeFromGuestCart — not found", { id });
      throw new AppError("Cart item not found.", 404, "NOT_FOUND");
    }

    await cartItem.destroy();

    logger.info(CTX, "removeFromGuestCart — deleted", { id });

    return NextResponse.json({
      success: true,
      message: "Item removed from cart.",
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "removeFromGuestCart — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── DELETE /api/guest-cart/session/:sessionId/clear ──────────────────────────
// Clear entire guest cart

export async function clearGuestCart(
  _req: NextRequest,
  sessionId: string,
): Promise<NextResponse> {
  logger.info(CTX, "clearGuestCart — start", { sessionId });

  try {
    if (!sessionId?.trim()) {
      throw new AppError("sessionId is required.", 400, "MISSING_SESSION_ID");
    }

    const deleted = await GuestCart.destroy({
      where: { sessionId: sessionId.trim() },
    });

    logger.info(CTX, "clearGuestCart — cleared", { sessionId, count: deleted });

    return NextResponse.json({
      success: true,
      message: `Cart cleared. ${deleted} item(s) removed.`,
      count: deleted,
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "clearGuestCart — failed", { sessionId, error });
    return errorResponse(error);
  }
}

// ─── POST /api/guest-cart/cleanup ─────────────────────────────────────────────
// Admin/Cron: Clean up expired cart items

export async function cleanupExpiredCarts(_req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "cleanupExpiredCarts — start");

  try {
    const deleted = await GuestCart.destroy({
      where: {
        expiresAt: { [Op.lt]: new Date() },
      },
    });

    logger.info(CTX, "cleanupExpiredCarts — done", { count: deleted });

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deleted} expired cart item(s).`,
      count: deleted,
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "cleanupExpiredCarts — failed", error);
    return errorResponse(error);
  }
}
