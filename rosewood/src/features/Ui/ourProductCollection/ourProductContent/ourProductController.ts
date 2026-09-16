import { NextRequest, NextResponse } from "next/server";
import Product from "./ourProductModel";
import CollectionCategory from "../ourProductCollectionCategoryModel";
import { storage } from "@/lib/storage";
import { logger } from "@/lib/logger";
import { AppError, errorResponse } from "@/lib/apiError";

const CTX = "OurProductController";

const MAX_FILE_SIZE  = 5 * 1024 * 1024; // 5 MB for images
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB for videos
const ALLOWED_IMAGE_TYPES  = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const ALLOWED_VIDEO_TYPES  = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];

// ─── Helper: validate + save an image file, return URL ────────────────────────
async function saveImageFile(file: File, folder: string): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new AppError(
      `Invalid image type "${file.type}". Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}.`,
      400,
      "INVALID_FILE_TYPE",
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new AppError("Image file size must not exceed 5 MB.", 400, "FILE_TOO_LARGE");
  }
  const result = await storage.save(file, folder);
  return result.url;
}

// ─── Helper: validate + save a video file, return URL ─────────────────────────
async function saveVideoFile(file: File, folder: string): Promise<string> {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    throw new AppError(
      `Invalid video type "${file.type}". Allowed: ${ALLOWED_VIDEO_TYPES.join(", ")}.`,
      400,
      "INVALID_VIDEO_TYPE",
    );
  }
  if (file.size > MAX_VIDEO_SIZE) {
    throw new AppError("Video file size must not exceed 50 MB.", 400, "VIDEO_TOO_LARGE");
  }
  const result = await storage.save(file, folder);
  return result.url;
}

// ─── Helper: delete a local image if it exists ───────────────────────────────
async function deleteIfLocal(url: string | null | undefined): Promise<void> {
  if (url && storage.isLocalUpload(url)) {
    await storage.delete(url);
  }
}

// ─── GET /api/ui/products ─────────────────────────────────────────────────────
// Public: active products  |  Admin: ?all=true
// Optional filter: ?categoryId=<uuid>

export async function getProducts(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "getProducts — start");

  try {
    const { searchParams } = new URL(req.url);
    const showAll    = searchParams.get("all") === "true";
    const categoryId = searchParams.get("categoryId");

    const where: Record<string, unknown> = {};
    if (!showAll)    where.isActive   = true;
    if (categoryId)  where.categoryId = categoryId;

    const products = await Product.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    logger.info(CTX, `getProducts — ${products.length} products`);
    return NextResponse.json({ success: true, data: products }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getProducts — failed", error);
    return errorResponse(error);
  }
}

// ─── GET /api/ui/products/:id ─────────────────────────────────────────────────

export async function getProduct(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "getProduct — start", { id });

  try {
    if (!id) throw new AppError("Product ID is required.", 400, "MISSING_ID");

    const product = await Product.findByPk(id);
    if (!product) {
      logger.warn(CTX, "getProduct — not found", { id });
      throw new AppError("Product not found.", 404, "NOT_FOUND");
    }

    return NextResponse.json({ success: true, data: product }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getProduct — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── POST /api/ui/products ────────────────────────────────────────────────────
// Admin: create a product
// multipart/form-data fields:
//   title (required), categoryId (required),
//   subtitle?, backgroundImage (file)?, backgroundImageUrl?,
//   videoUrl?,
//   photo1 (file)?, photo1Url?, photo1Title?, photo1Subtitle?,
//   photo2 (file)?, photo2Url?, photo2Title?, photo2Subtitle?,
//   isActive?

export async function createProduct(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "createProduct — start");

  try {
    const contentType = req.headers.get("content-type") ?? "";
    let fields: Record<string, string> = {};
    let backgroundImage: string | null = null;
    let videoFile: string | null = null;
    let photo1Url: string | null = null;
    let photo2Url: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      for (const [key, value] of formData.entries()) {
        if (typeof value === "string") fields[key] = value;
      }

      const bgFile     = formData.get("backgroundImage") as File | null;
      const vidFile    = formData.get("video")           as File | null;
      const photo1File = formData.get("photo1")          as File | null;
      const photo2File = formData.get("photo2")          as File | null;

      if (bgFile?.size)     backgroundImage = await saveImageFile(bgFile, "ui/products/bg");
      else if (fields.backgroundImageUrl) backgroundImage = fields.backgroundImageUrl;

      if (vidFile?.size)    videoFile = await saveVideoFile(vidFile, "ui/products/videos");

      if (photo1File?.size) photo1Url = await saveImageFile(photo1File, "ui/products/photo1");
      else if (fields.photo1Url) photo1Url = fields.photo1Url;

      if (photo2File?.size) photo2Url = await saveImageFile(photo2File, "ui/products/photo2");
      else if (fields.photo2Url) photo2Url = fields.photo2Url;

    } else {
      const body = await req.json() as Record<string, string>;
      fields          = body;
      backgroundImage = body.backgroundImage ?? body.backgroundImageUrl ?? null;
      photo1Url       = body.photo1Url ?? null;
      photo2Url       = body.photo2Url ?? null;
    }

    const { title, subtitle, categoryId, videoUrl,
            photo1Title, photo1Subtitle,
            photo2Title, photo2Subtitle, isActive } = fields;

    if (!title?.trim())
      throw new AppError("title is required.", 400, "MISSING_TITLE");
    if (!categoryId)
      throw new AppError("categoryId is required.", 400, "MISSING_CATEGORY_ID");

    const category = await CollectionCategory.findByPk(categoryId);
    if (!category)
      throw new AppError("Category not found.", 404, "CATEGORY_NOT_FOUND");

    const product = await Product.create({
      title:          title.trim(),
      subtitle:       subtitle?.trim()        || null,
      categoryId,
      backgroundImage,
      videoUrl:       videoUrl?.trim()        || null,
      videoFile,
      photo1Url,
      photo1Title:    photo1Title?.trim()     || null,
      photo1Subtitle: photo1Subtitle?.trim()  || null,
      photo2Url,
      photo2Title:    photo2Title?.trim()     || null,
      photo2Subtitle: photo2Subtitle?.trim()  || null,
      isActive:       isActive !== undefined ? isActive !== "false" : true,
    });

    logger.info(CTX, "createProduct — created", { id: product.id });
    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    logger.error(CTX, "createProduct — failed", error);
    return errorResponse(error);
  }
}

// ─── PUT /api/ui/products/:id ─────────────────────────────────────────────────
// Admin: update a product (multipart/form-data or JSON)

export async function updateProduct(
  req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "updateProduct — start", { id });   

  try {
    if (!id) throw new AppError("Product ID is required.", 400, "MISSING_ID");

    const product = await Product.findByPk(id);
    if (!product) {
      logger.warn(CTX, "updateProduct — not found", { id });
      throw new AppError("Product not found.", 404, "NOT_FOUND");
    }

    const contentType = req.headers.get("content-type") ?? "";
    let fields: Record<string, string> = {};
    let backgroundImage: string | null | undefined;
    let videoFile: string | null | undefined;
    let photo1Url: string | null | undefined;
    let photo2Url: string | null | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      for (const [key, value] of formData.entries()) {
        if (typeof value === "string") fields[key] = value;
      }

      const bgFile     = formData.get("backgroundImage") as File | null;
      const vidFile    = formData.get("video")           as File | null;
      const photo1File = formData.get("photo1")          as File | null;
      const photo2File = formData.get("photo2")          as File | null;

      if (bgFile?.size) {
        await deleteIfLocal(product.backgroundImage);
        backgroundImage = await saveImageFile(bgFile, "ui/products/bg");
        logger.debug(CTX, "updateProduct — bg replaced", { backgroundImage });
      } else if (fields.backgroundImageUrl !== undefined) {
        backgroundImage = fields.backgroundImageUrl || null;
      }

      if (vidFile?.size) {
        await deleteIfLocal(product.videoFile);
        videoFile = await saveVideoFile(vidFile, "ui/products/videos");
        logger.debug(CTX, "updateProduct — video replaced", { videoFile });
      } else if (fields.videoFile !== undefined) {
        // Empty string = explicit clear request
        if (fields.videoFile === "") {
          await deleteIfLocal(product.videoFile);
          videoFile = null;
          logger.debug(CTX, "updateProduct — videoFile cleared");
        } else {
          videoFile = fields.videoFile || null;
        }
      }

      if (photo1File?.size) {
        await deleteIfLocal(product.photo1Url);
        photo1Url = await saveImageFile(photo1File, "ui/products/photo1");
        logger.debug(CTX, "updateProduct — photo1 replaced", { photo1Url });
      } else if (fields.photo1Url !== undefined) {
        photo1Url = fields.photo1Url || null;
      }

      if (photo2File?.size) {
        await deleteIfLocal(product.photo2Url);
        photo2Url = await saveImageFile(photo2File, "ui/products/photo2");
        logger.debug(CTX, "updateProduct — photo2 replaced", { photo2Url });
      } else if (fields.photo2Url !== undefined) {
        photo2Url = fields.photo2Url || null;
      }

    } else {
      fields = await req.json() as Record<string, string>;
      if (fields.backgroundImage !== undefined) backgroundImage = fields.backgroundImage || null;
      if (fields.videoFile       !== undefined) videoFile       = fields.videoFile       || null;
      if (fields.photo1Url       !== undefined) photo1Url       = fields.photo1Url       || null;
      if (fields.photo2Url       !== undefined) photo2Url       = fields.photo2Url       || null;
    }

    // Validate new category if being changed
    if (fields.categoryId) {
      const newCat = await CollectionCategory.findByPk(fields.categoryId);
      if (!newCat)
        throw new AppError("Target category not found.", 404, "CATEGORY_NOT_FOUND");
    }

    await product.update({
      ...(backgroundImage    !== undefined && { backgroundImage }),
      ...(videoFile          !== undefined && { videoFile }),
      ...(photo1Url          !== undefined && { photo1Url }),
      ...(photo2Url          !== undefined && { photo2Url }),
      ...(fields.title       !== undefined && { title:          fields.title.trim() }),
      ...(fields.subtitle    !== undefined && { subtitle:       fields.subtitle.trim()       || null }),
      ...(fields.videoUrl    !== undefined && { videoUrl:       fields.videoUrl.trim()       || null }),
      ...(fields.photo1Title !== undefined && { photo1Title:    fields.photo1Title.trim()    || null }),
      ...(fields.photo1Subtitle !== undefined && { photo1Subtitle: fields.photo1Subtitle.trim() || null }),
      ...(fields.photo2Title !== undefined && { photo2Title:    fields.photo2Title.trim()    || null }),
      ...(fields.photo2Subtitle !== undefined && { photo2Subtitle: fields.photo2Subtitle.trim() || null }),
      ...(fields.categoryId  !== undefined && { categoryId:    fields.categoryId }),
      ...(fields.isActive    !== undefined && { isActive:      fields.isActive !== "false" }),
    });

    logger.info(CTX, "updateProduct — updated", { id });
    return NextResponse.json({ success: true, data: product }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "updateProduct — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── PATCH /api/ui/products/:id/toggle ───────────────────────────────────────

export async function toggleProduct(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "toggleProduct — start", { id });

  try {
    if (!id) throw new AppError("Product ID is required.", 400, "MISSING_ID");

    const product = await Product.findByPk(id);
    if (!product) throw new AppError("Product not found.", 404, "NOT_FOUND");

    await product.update({ isActive: !product.isActive });

    logger.info(CTX, "toggleProduct — toggled", { id, isActive: product.isActive });

    return NextResponse.json(
      {
        success: true,
        message: `Product is now ${product.isActive ? "active" : "inactive"}.`,
        data: { id: product.id, isActive: product.isActive },
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error(CTX, "toggleProduct — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── DELETE /api/ui/products/:id ──────────────────────────────────────────────
// Deletes the product and cleans up all associated images from storage

export async function deleteProduct(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "deleteProduct — start", { id });

  try {
    if (!id) throw new AppError("Product ID is required.", 400, "MISSING_ID");

    const product = await Product.findByPk(id);
    if (!product) {
      logger.warn(CTX, "deleteProduct — not found", { id });
      throw new AppError("Product not found.", 404, "NOT_FOUND");
    }

    // Clean up all associated images and videos
    const files = [product.backgroundImage, product.videoFile, product.photo1Url, product.photo2Url];
    for (const url of files) {
      await deleteIfLocal(url);
      if (url) logger.debug(CTX, "deleteProduct — file deleted", { url });
    }

    await product.destroy();

    logger.info(CTX, "deleteProduct — deleted", { id });
    return NextResponse.json(
      { success: true, message: "Product deleted." },
      { status: 200 },
    );
  } catch (error) {
    logger.error(CTX, "deleteProduct — failed", { id, error });
    return errorResponse(error);
  }
}
