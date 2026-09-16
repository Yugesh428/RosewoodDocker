import { NextRequest, NextResponse } from "next/server";
import ProductIngredient from "./productIngredientModel";
import Product from "./productModel";
import { logger } from "@/lib/logger";
import { AppError, errorResponse } from "@/lib/apiError";

const CTX = "ProductIngredientController";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toNum(val: unknown): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

// ─── GET /api/products/:productId/ingredients ─────────────────────────────────

export async function getIngredientsByProduct(
  _req: NextRequest,
  productId: string,
): Promise<NextResponse> {
  logger.info(CTX, "getIngredientsByProduct — start", { productId });

  try {
    if (!productId) throw new AppError("Product ID is required.", 400, "MISSING_ID");

    const product = await Product.findByPk(productId, { attributes: ["id", "productName"] });
    if (!product) throw new AppError("Product not found.", 404, "PRODUCT_NOT_FOUND");

    const ingredients = await ProductIngredient.findAll({
      where: { productId },
      order: [["sortOrder", "ASC"], ["createdAt", "ASC"]],
    });

    logger.info(CTX, `getIngredientsByProduct — ${ingredients.length} found`, { productId });

    return NextResponse.json({
      success: true,
      product: { id: product.id, productName: product.productName },
      count:   ingredients.length,
      data:    ingredients,
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getIngredientsByProduct — failed", { productId, error });
    return errorResponse(error);
  }
}

// ─── POST /api/products/:productId/ingredients ────────────────────────────────
// Add a single ingredient to a product.
// Body: { ingredientName, quantity?, unit?, sortOrder? }

export async function addIngredient(
  req: NextRequest,
  productId: string,
): Promise<NextResponse> {
  logger.info(CTX, "addIngredient — start", { productId });

  try {
    if (!productId) throw new AppError("Product ID is required.", 400, "MISSING_ID");

    const product = await Product.findByPk(productId);
    if (!product) throw new AppError("Product not found.", 404, "PRODUCT_NOT_FOUND");

    const body = await req.json();
    const { ingredientName, quantity, unit, sortOrder } = body;

    logger.debug(CTX, "addIngredient — payload", { productId, ingredientName });

    if (!ingredientName?.trim()) {
      throw new AppError("ingredientName is required.", 400, "VALIDATION_ERROR");
    }

    // Default sortOrder to the end of the current list
    let order = sortOrder != null ? toNum(sortOrder) : null;
    if (order === null) {
      const last = await ProductIngredient.max<number, ProductIngredient>("sortOrder", {
        where: { productId },
      });
      order = (last ?? -1) + 1;
    }

    const ingredient = await ProductIngredient.create({
      productId,
      ingredientName: ingredientName.trim(),
      quantity:       quantity ? String(quantity).trim() : null,
      unit:           unit     ? String(unit).trim()     : null,
      sortOrder:      order,
    });

    logger.info(CTX, "addIngredient — created", { id: ingredient.id, productId });

    return NextResponse.json({ success: true, data: ingredient }, { status: 201 });
  } catch (error) {
    logger.error(CTX, "addIngredient — failed", { productId, error });
    return errorResponse(error);
  }
}

// ─── PUT /api/products/:productId/ingredients/:id ─────────────────────────────
// Update a single ingredient row.

export async function updateIngredient(
  req: NextRequest,
  productId: string,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "updateIngredient — start", { productId, id });

  try {
    if (!id) throw new AppError("Ingredient ID is required.", 400, "MISSING_ID");

    const ingredient = await ProductIngredient.findOne({ where: { id, productId } });
    if (!ingredient) {
      logger.warn(CTX, "updateIngredient — not found", { id, productId });
      throw new AppError("Ingredient not found.", 404, "NOT_FOUND");
    }

    const body = await req.json();
    const { ingredientName, quantity, unit, sortOrder } = body;

    logger.debug(CTX, "updateIngredient — payload", { id, ingredientName });

    await ingredient.update({
      ...(ingredientName != null && { ingredientName: String(ingredientName).trim() }),
      ...(quantity       != null && { quantity:       String(quantity).trim() || null }),
      ...(unit           != null && { unit:           String(unit).trim() || null }),
      ...(sortOrder      != null && { sortOrder:      toNum(sortOrder) }),
    });

    logger.info(CTX, "updateIngredient — updated", { id });

    return NextResponse.json({ success: true, data: ingredient }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "updateIngredient — failed", { productId, id, error });
    return errorResponse(error);
  }
}

// ─── DELETE /api/products/:productId/ingredients/:id ─────────────────────────

export async function deleteIngredient(
  _req: NextRequest,
  productId: string,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "deleteIngredient — start", { productId, id });

  try {
    if (!id) throw new AppError("Ingredient ID is required.", 400, "MISSING_ID");

    const ingredient = await ProductIngredient.findOne({ where: { id, productId } });
    if (!ingredient) {
      logger.warn(CTX, "deleteIngredient — not found", { id, productId });
      throw new AppError("Ingredient not found.", 404, "NOT_FOUND");
    }

    const { ingredientName } = ingredient;
    await ingredient.destroy();

    logger.info(CTX, "deleteIngredient — deleted", { id, productId, ingredientName });

    return NextResponse.json({
      success: true,
      message: `"${ingredientName}" removed.`,
      data: { id, productId },
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "deleteIngredient — failed", { productId, id, error });
    return errorResponse(error);
  }
}

// ─── PUT /api/products/:productId/ingredients ─────────────────────────────────
// Replace ALL ingredients for a product in one shot.
// Body: [{ ingredientName, quantity?, unit?, sortOrder? }, ...]

export async function replaceIngredients(
  req: NextRequest,
  productId: string,
): Promise<NextResponse> {
  logger.info(CTX, "replaceIngredients — start", { productId });

  try {
    if (!productId) throw new AppError("Product ID is required.", 400, "MISSING_ID");

    const product = await Product.findByPk(productId);
    if (!product) throw new AppError("Product not found.", 404, "PRODUCT_NOT_FOUND");

    const body = await req.json();
    if (!Array.isArray(body)) {
      throw new AppError("Body must be an array of ingredient objects.", 400, "INVALID_BODY");
    }

    const validated = body
      .filter((i) => i?.ingredientName?.trim())
      .map((i, idx) => ({
        productId,
        ingredientName: String(i.ingredientName).trim(),
        quantity:       i.quantity ? String(i.quantity).trim() : null,
        unit:           i.unit     ? String(i.unit).trim()     : null,
        sortOrder:      i.sortOrder != null ? toNum(i.sortOrder) : idx,
      }));

    await ProductIngredient.destroy({ where: { productId } });

    const created = validated.length > 0
      ? await ProductIngredient.bulkCreate(validated, { validate: true })
      : [];

    logger.info(CTX, "replaceIngredients — replaced", { productId, count: created.length });

    return NextResponse.json({
      success: true,
      message: `${created.length} ingredient(s) saved.`,
      data: created,
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "replaceIngredients — failed", { productId, error });
    return errorResponse(error);
  }
}
