import { NextRequest, NextResponse } from "next/server";
import CollectionCategory, {
  CollectionItem,
} from "./ourProductCollectionCategoryModel";
import { storage } from "@/lib/storage";
import { logger } from "@/lib/logger";
import { AppError, errorResponse } from "@/lib/apiError";

const CTX = "CollectionController";

// ─── GET /api/ui/collection/categories ───────────────────────────────────────
// Public: active only  |  Admin: ?all=true returns all

export async function getCategories(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "getCategories — start");

  try {
    const showAll = new URL(req.url).searchParams.get("all") === "true";
    const where = showAll ? {} : { isActive: true };

    const categories = await CollectionCategory.findAll({
      where,
      order: [
        ["displayOrder", "ASC"],
        ["name", "ASC"],
      ],
    });

    logger.info(CTX, `getCategories — ${categories.length} categories`);
    return NextResponse.json({ success: true, data: categories }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getCategories — failed", error);
    return errorResponse(error);
  }
}

// ─── POST /api/ui/collection/categories ──────────────────────────────────────
// Admin: create a new tab category
// Body: { name, slug, description?, displayOrder?, isActive? }

export async function createCategory(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "createCategory — start");

  try {
    const body = await req.json();
    const { name, slug, description, displayOrder, isActive } = body;

    if (!name?.trim() || !slug?.trim()) {
      throw new AppError("name and slug are required.", 400, "MISSING_FIELDS");
    }

    const category = await CollectionCategory.create({
      name:         name.trim(),
      slug:         slug.trim(),
      description:  description ?? null,
      displayOrder: displayOrder ?? 0,
      isActive:     isActive    ?? true,
    });

    logger.info(CTX, "createCategory — created", { id: category.id });
    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    logger.error(CTX, "createCategory — failed", error);
    return errorResponse(error);
  }
}

// ─── PUT /api/ui/collection/categories/:id ────────────────────────────────────
// Admin: update name, slug, description, displayOrder, isActive

export async function updateCategory(
  req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "updateCategory — start", { id });

  try {
    if (!id) throw new AppError("Category ID is required.", 400, "MISSING_ID");

    const category = await CollectionCategory.findByPk(id);
    if (!category) {
      logger.warn(CTX, "updateCategory — not found", { id });
      throw new AppError("Category not found.", 404, "NOT_FOUND");
    }

    const body = await req.json();
    const { name, slug, description, displayOrder, isActive } = body;

    await category.update({
      ...(name         !== undefined && { name:         name.trim() }),
      ...(slug         !== undefined && { slug:         slug.trim() }),
      ...(description  !== undefined && { description:  description || null }),
      ...(displayOrder !== undefined && { displayOrder }),
      ...(isActive     !== undefined && { isActive }),
    });

    logger.info(CTX, "updateCategory — updated", { id });
    return NextResponse.json({ success: true, data: category }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "updateCategory — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── PATCH /api/ui/collection/categories/:id/toggle ──────────────────────────
// Admin: flip isActive true ↔ false

export async function toggleCategory(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "toggleCategory — start", { id });

  try {
    if (!id) throw new AppError("Category ID is required.", 400, "MISSING_ID");

    const category = await CollectionCategory.findByPk(id);
    if (!category) throw new AppError("Category not found.", 404, "NOT_FOUND");

    await category.update({ isActive: !category.isActive });

    logger.info(CTX, "toggleCategory — toggled", { id, isActive: category.isActive });

    return NextResponse.json(
      {
        success: true,
        message: `Category is now ${category.isActive ? "active" : "inactive"}.`,
        data: { id: category.id, isActive: category.isActive },
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error(CTX, "toggleCategory — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── DELETE /api/ui/collection/categories/:id ────────────────────────────────
// Admin: delete category + cascade delete all its items + clean up images

export async function deleteCategory(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "deleteCategory — start", { id });

  try {
    if (!id) throw new AppError("Category ID is required.", 400, "MISSING_ID");

    // Fetch with items so we can clean up their images before DB delete
    const category = await CollectionCategory.findByPk(id, {
      include: [{ model: CollectionItem, as: "items" }],
    }) as (CollectionCategory & { items: CollectionItem[] }) | null;

    if (!category) {
      logger.warn(CTX, "deleteCategory — not found", { id });
      throw new AppError("Category not found.", 404, "NOT_FOUND");
    }

    // Clean up stored images for each item before cascade destroy
    if (category.items && category.items.length > 0) {
      for (const item of category.items) {
        if (storage.isLocalUpload(item.imageUrl)) {
          await storage.delete(item.imageUrl);
          logger.debug(CTX, "deleteCategory — item image deleted", { imageUrl: item.imageUrl });
        }
      }
    }

    // DB cascade removes all child CollectionItems automatically
    await category.destroy();

    logger.info(CTX, "deleteCategory — deleted", { id });
    return NextResponse.json(
      { success: true, message: "Category and all its items deleted." },
      { status: 200 },
    );
  } catch (error) {
    logger.error(CTX, "deleteCategory — failed", { id, error });
    return errorResponse(error);
  }
}
