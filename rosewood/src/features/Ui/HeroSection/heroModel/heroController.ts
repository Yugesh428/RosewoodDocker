import { NextRequest, NextResponse } from "next/server";
import HeroSlide from "./heroModel";
import { storage } from "@/lib/storage";
import { logger } from "@/lib/logger";
import { AppError, errorResponse } from "@/lib/apiError";

const CTX = "HeroController";

const MAX_SLIDES   = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

// ─── GET /api/ui/hero ─────────────────────────────────────────────────────────
// Public: returns only active slides sorted by order
// Admin:  ?all=true returns all slides including inactive

export async function getHeroSlides(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "getHeroSlides — start");

  try {
    const showAll = new URL(req.url).searchParams.get("all") === "true";

    const where = showAll ? {} : { isActive: true };

    const slides = await HeroSlide.findAll({
      where,
      order: [["order", "ASC"]],
    });

    logger.info(CTX, `getHeroSlides — ${slides.length} slides`);

    return NextResponse.json({ success: true, data: slides }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getHeroSlides — failed", error);
    return errorResponse(error);
  }
}

// ─── POST /api/ui/hero ────────────────────────────────────────────────────────
// Admin: upload a new hero slide image
// multipart/form-data: image (file), title?, subtitle?, order?, isActive?

export async function createHeroSlide(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "createHeroSlide — start");

  try {
    // Check slide count limit
    const count = await HeroSlide.count();
    if (count >= MAX_SLIDES) {
      throw new AppError(
        `Maximum of ${MAX_SLIDES} hero slides allowed. Delete one before adding more.`,
        400,
        "MAX_SLIDES_REACHED",
      );
    }

    const contentType = req.headers.get("content-type") ?? "";

    let imageUrl: string | null = null;
    let fields: Record<string, string> = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      // Collect text fields
      for (const [key, value] of formData.entries()) {
        if (key !== "image" && typeof value === "string") {
          fields[key] = value;
        }
      }

      const file = formData.get("image") as File | null;

      if (file && file.size > 0) {
        // Validate file
        if (!ALLOWED_TYPES.includes(file.type)) {
          throw new AppError(
            `Invalid file type "${file.type}". Allowed: ${ALLOWED_TYPES.join(", ")}.`,
            400,
            "INVALID_FILE_TYPE",
          );
        }
        if (file.size > MAX_FILE_SIZE) {
          throw new AppError("File size must not exceed 5MB.", 400, "FILE_TOO_LARGE");
        }

        const result = await storage.save(file, "hero");
        imageUrl = result.url;
        logger.debug(CTX, "createHeroSlide — image saved", { imageUrl });
      } else if (fields.imageUrl) {
        // Allow external URL fallback
        imageUrl = fields.imageUrl;
      }
    } else {
      // JSON body with imageUrl
      const body = await req.json();
      fields = body;
      imageUrl = body.imageUrl ?? null;
    }

    if (!imageUrl) {
      throw new AppError("An image file or imageUrl is required.", 400, "MISSING_IMAGE");
    }

    const slide = await HeroSlide.create({
      imageUrl,
      title:    fields.title    ?? null,
      subtitle: fields.subtitle ?? null,
      order:    fields.order    ? parseInt(fields.order)   : count,
      isActive: fields.isActive ? fields.isActive !== "false" : true,
    });

    logger.info(CTX, "createHeroSlide — created", { id: slide.id });

    return NextResponse.json({ success: true, data: slide }, { status: 201 });
  } catch (error) {
    logger.error(CTX, "createHeroSlide — failed", error);
    return errorResponse(error);
  }
}

// ─── PUT /api/ui/hero/:id ─────────────────────────────────────────────────────
// Admin: update slide text fields or replace image

export async function updateHeroSlide(
  req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "updateHeroSlide — start", { id });

  try {
    if (!id) throw new AppError("Slide ID is required.", 400, "MISSING_ID");

    const slide = await HeroSlide.findByPk(id);
    if (!slide) {
      logger.warn(CTX, "updateHeroSlide — not found", { id });
      throw new AppError("Hero slide not found.", 404, "NOT_FOUND");
    }

    const contentType = req.headers.get("content-type") ?? "";
    let fields: Record<string, string> = {};
    let newImageUrl: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      for (const [key, value] of formData.entries()) {
        if (key !== "image" && typeof value === "string") fields[key] = value;
      }

      const file = formData.get("image") as File | null;
      if (file && file.size > 0) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          throw new AppError(`Invalid file type "${file.type}".`, 400, "INVALID_FILE_TYPE");
        }
        if (file.size > MAX_FILE_SIZE) {
          throw new AppError("File size must not exceed 5MB.", 400, "FILE_TOO_LARGE");
        }

        // Delete old local image before replacing
        if (storage.isLocalUpload(slide.imageUrl)) {
          await storage.delete(slide.imageUrl);
        }

        const result = await storage.save(file, "hero");
        newImageUrl = result.url;
        logger.debug(CTX, "updateHeroSlide — image replaced", { newImageUrl });
      }
    } else {
      fields = await req.json();
      if (fields.imageUrl) newImageUrl = fields.imageUrl;
    }

    await slide.update({
      ...(newImageUrl              !== undefined && { imageUrl: newImageUrl }),
      ...(fields.title             !== undefined && { title:    fields.title    || null }),
      ...(fields.subtitle          !== undefined && { subtitle: fields.subtitle || null }),
      ...(fields.order             !== undefined && { order:    parseInt(fields.order) }),
      ...(fields.isActive          !== undefined && { isActive: fields.isActive !== "false" }),
    });

    logger.info(CTX, "updateHeroSlide — updated", { id });

    return NextResponse.json({ success: true, data: slide }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "updateHeroSlide — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── PATCH /api/ui/hero/:id/toggle ────────────────────────────────────────────
// Admin: toggle isActive

export async function toggleHeroSlide(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "toggleHeroSlide — start", { id });

  try {
    if (!id) throw new AppError("Slide ID is required.", 400, "MISSING_ID");

    const slide = await HeroSlide.findByPk(id);
    if (!slide) throw new AppError("Hero slide not found.", 404, "NOT_FOUND");

    await slide.update({ isActive: !slide.isActive });

    logger.info(CTX, "toggleHeroSlide — toggled", { id, isActive: slide.isActive });

    return NextResponse.json({
      success: true,
      message: `Slide is now ${slide.isActive ? "active" : "inactive"}.`,
      data: { id: slide.id, isActive: slide.isActive },
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "toggleHeroSlide — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── PATCH /api/ui/hero/reorder ───────────────────────────────────────────────
// Admin: reorder slides
// Body: [{ id, order }, ...]

export async function reorderHeroSlides(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "reorderHeroSlides — start");

  try {
    const body = await req.json();

    if (!Array.isArray(body) || body.length === 0) {
      throw new AppError("Body must be a non-empty array of { id, order }.", 400, "INVALID_BODY");
    }

    await Promise.all(
      body.map(({ id, order }: { id: string; order: number }) =>
        HeroSlide.update({ order }, { where: { id } }),
      ),
    );

    logger.info(CTX, "reorderHeroSlides — done", { count: body.length });

    const updated = await HeroSlide.findAll({ order: [["order", "ASC"]] });

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "reorderHeroSlides — failed", error);
    return errorResponse(error);
  }
}

// ─── DELETE /api/ui/hero/:id ──────────────────────────────────────────────────
// Admin: delete slide and its image

export async function deleteHeroSlide(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "deleteHeroSlide — start", { id });

  try {
    if (!id) throw new AppError("Slide ID is required.", 400, "MISSING_ID");

    const slide = await HeroSlide.findByPk(id);
    if (!slide) throw new AppError("Hero slide not found.", 404, "NOT_FOUND");

    // Delete the image file from local storage (or S3 later)
    if (storage.isLocalUpload(slide.imageUrl)) {
      await storage.delete(slide.imageUrl);
      logger.debug(CTX, "deleteHeroSlide — image deleted", { imageUrl: slide.imageUrl });
    }

    await slide.destroy();

    logger.info(CTX, "deleteHeroSlide — deleted", { id });

    return NextResponse.json({
      success: true,
      message: "Hero slide deleted.",
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "deleteHeroSlide — failed", { id, error });
    return errorResponse(error);
  }
}
