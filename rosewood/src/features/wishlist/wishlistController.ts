import { NextRequest, NextResponse } from "next/server";
import { type Includeable } from "sequelize";
import Wishlist from "./wishlistModel";
import Product from "../products/productModel";
import User from "@/lib/models/userModel";
import Category from "../productCategory/productCatetgoryModel";
import { logger } from "@/lib/logger";
import { AppError, errorResponse } from "@/lib/apiError";

const CTX = "WishlistController";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRODUCT_INCLUDE: Includeable[] = [
  {
    model: Product,
    as: "product",
    attributes: ["id", "productName", "productImage", "sellingPrice", "originalPrice", "discount", "isActive"],
    include: [
      { model: Category, as: "category", attributes: ["id", "categoryName"] },
    ],
  },
];

// ─── GET /api/wishlist?customerId=xxx ─────────────────────────────────────────

export async function getWishlistByCustomer(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "getWishlistByCustomer — start");

  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");

    if (!customerId) throw new AppError("customerId query param is required.", 400, "MISSING_PARAM");

    const customer = await User.findByPk(customerId, { attributes: ["id", "name", "email"] });
    if (!customer) throw new AppError("Customer not found.", 404, "CUSTOMER_NOT_FOUND");

    const items = await Wishlist.findAll({
      where: { customerId },
      include: PRODUCT_INCLUDE,
      order: [["createdAt", "DESC"]],
    });

    logger.info(CTX, `getWishlistByCustomer — ${items.length} items`, { customerId });

    return NextResponse.json({
      success: true,
      customer: { id: customer.id, name: customer.name, email: customer.email },
      count: items.length,
      data: items,
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getWishlistByCustomer — failed", error);
    return errorResponse(error);
  }
}

// ─── POST /api/wishlist ───────────────────────────────────────────────────────
// Body: { customerId, productId }

export async function addToWishlist(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "addToWishlist — start");

  try {
    const body = await req.json();
    const { customerId, productId } = body;

    logger.debug(CTX, "addToWishlist — payload", { customerId, productId });

    if (!customerId) throw new AppError("customerId is required.", 400, "VALIDATION_ERROR");
    if (!productId)  throw new AppError("productId is required.",  400, "VALIDATION_ERROR");

    const customer = await User.findByPk(customerId);
    if (!customer) throw new AppError("Customer not found.", 404, "CUSTOMER_NOT_FOUND");

    const product = await Product.findByPk(productId);
    if (!product) throw new AppError("Product not found.", 404, "PRODUCT_NOT_FOUND");

    // Check duplicate
    const existing = await Wishlist.findOne({ where: { customerId, productId } });
    if (existing) {
      logger.warn(CTX, "addToWishlist — already exists", { customerId, productId });
      throw new AppError("Product is already in wishlist.", 409, "DUPLICATE");
    }

    const item = await Wishlist.create({ customerId, productId });

    const result = await Wishlist.findByPk(item.id, { include: PRODUCT_INCLUDE });

    logger.info(CTX, "addToWishlist — added", { id: item.id, customerId, productId });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    logger.error(CTX, "addToWishlist — failed", error);
    return errorResponse(error);
  }
}

// ─── DELETE /api/wishlist/:id ─────────────────────────────────────────────────

export async function removeFromWishlist(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "removeFromWishlist — start", { id });

  try {
    if (!id) throw new AppError("Wishlist item ID is required.", 400, "MISSING_ID");

    const item = await Wishlist.findByPk(id);
    if (!item) {
      logger.warn(CTX, "removeFromWishlist — not found", { id });
      throw new AppError("Wishlist item not found.", 404, "NOT_FOUND");
    }

    const { customerId, productId } = item;
    await item.destroy();

    logger.info(CTX, "removeFromWishlist — removed", { id, customerId, productId });

    return NextResponse.json({
      success: true,
      message: "Item removed from wishlist.",
      data: { id, customerId, productId },
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "removeFromWishlist — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── DELETE /api/wishlist/customer/:customerId ────────────────────────────────
// Clear entire wishlist for a customer

export async function clearWishlist(
  _req: NextRequest,
  customerId: string,
): Promise<NextResponse> {
  logger.info(CTX, "clearWishlist — start", { customerId });

  try {
    if (!customerId) throw new AppError("Customer ID is required.", 400, "MISSING_ID");

    const customer = await User.findByPk(customerId);
    if (!customer) throw new AppError("Customer not found.", 404, "CUSTOMER_NOT_FOUND");

    const deleted = await Wishlist.destroy({ where: { customerId } });

    logger.info(CTX, "clearWishlist — cleared", { customerId, count: deleted });

    return NextResponse.json({
      success: true,
      message: `${deleted} item(s) removed from wishlist.`,
      data: { customerId, count: deleted },
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "clearWishlist — failed", { customerId, error });
    return errorResponse(error);
  }
}
