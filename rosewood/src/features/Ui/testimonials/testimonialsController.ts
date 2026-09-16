import { NextRequest, NextResponse } from "next/server";
import Testimonial from "./testimonialsModel";
import { storage } from "@/lib/storage";
import { logger } from "@/lib/logger";
import { AppError, errorResponse } from "@/lib/apiError";

const CTX = "TestimonialController";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

// ─── Helper: validate + save photo ───────────────────────────────────────────
async function savePhoto(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new AppError(
      `Invalid file type "${file.type}". Allowed: ${ALLOWED_TYPES.join(", ")}.`,
      400,
      "INVALID_FILE_TYPE",
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new AppError("Photo must not exceed 5 MB.", 400, "FILE_TOO_LARGE");
  }
  const result = await storage.save(file, "testimonials");
  return result.url;
}

// ─── GET /api/ui/testimonials ─────────────────────────────────────────────────
// Public: active only  |  Admin: ?all=true

export async function getTestimonials(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "getTestimonials — start");

  try {
    const showAll = new URL(req.url).searchParams.get("all") === "true";
    const where = showAll ? {} : { isActive: true };

    const testimonials = await Testimonial.findAll({
      where,
      order: [
        ["displayOrder", "ASC"],
        ["createdAt",    "ASC"],
      ],
    });

    logger.info(CTX, `getTestimonials — ${testimonials.length} items`);
    return NextResponse.json({ success: true, data: testimonials }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getTestimonials — failed", error);
    return errorResponse(error);
  }
}

// ─── GET /api/ui/testimonials/:id ─────────────────────────────────────────────
export async function getTestimonial(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "getTestimonial — start", { id });

  try {
    if (!id) throw new AppError("Testimonial ID is required.", 400, "MISSING_ID");

    const testimonial = await Testimonial.findByPk(id);
    if (!testimonial) {
      logger.warn(CTX, "getTestimonial — not found", { id });
      throw new AppError("Testimonial not found.", 404, "NOT_FOUND");
    }

    return NextResponse.json({ success: true, data: testimonial }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getTestimonial — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── POST /api/ui/testimonials ────────────────────────────────────────────────
// Admin: create a testimonial
// multipart/form-data: photo (file) OR photoUrl, rating, quote, authorName,
//                      authorTitle?, displayOrder?, isActive?

export async function createTestimonial(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "createTestimonial — start");

  try {
    const contentType = req.headers.get("content-type") ?? "";
    let fields: Record<string, string> = {};
    let photo: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      for (const [key, value] of formData.entries()) {
        if (typeof value === "string" && key !== "photo") fields[key] = value;
      }

      const file = formData.get("photo") as File | null;
      if (file?.size) {
        photo = await savePhoto(file);
        logger.debug(CTX, "createTestimonial — photo saved", { photo });
      } else if (fields.photoUrl) {
        photo = fields.photoUrl;
      }
    } else {
      const body = await req.json() as Record<string, string>;
      fields = body;
      photo  = body.photo ?? body.photoUrl ?? null;
    }

    const { rating, quote, authorName, authorTitle, displayOrder, isActive } = fields;

    if (!photo)
      throw new AppError("photo (file or URL) is required.", 400, "MISSING_PHOTO");
    if (!rating)
      throw new AppError("rating is required (1–5).", 400, "MISSING_RATING");
    if (!quote?.trim())
      throw new AppError("quote is required.", 400, "MISSING_QUOTE");
    if (!authorName?.trim())
      throw new AppError("authorName is required.", 400, "MISSING_AUTHOR");

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      throw new AppError("rating must be a number between 1 and 5.", 400, "INVALID_RATING");
    }

    const testimonial = await Testimonial.create({
      photo,
      rating:       ratingNum,
      quote:        quote.trim(),
      authorName:   authorName.trim(),
      authorTitle:  authorTitle?.trim()  || null,
      displayOrder: displayOrder ? Number(displayOrder) : 0,
      isActive:     isActive !== undefined ? isActive !== "false" : true,
    });

    logger.info(CTX, "createTestimonial — created", { id: testimonial.id });
    return NextResponse.json({ success: true, data: testimonial }, { status: 201 });
  } catch (error) {
    logger.error(CTX, "createTestimonial — failed", error);
    return errorResponse(error);
  }
}

// ─── PUT /api/ui/testimonials/:id ─────────────────────────────────────────────
// Admin: update (multipart/form-data or JSON)

export async function updateTestimonial(
  req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "updateTestimonial — start", { id });

  try {
    if (!id) throw new AppError("Testimonial ID is required.", 400, "MISSING_ID");

    const testimonial = await Testimonial.findByPk(id);
    if (!testimonial) {
      logger.warn(CTX, "updateTestimonial — not found", { id });
      throw new AppError("Testimonial not found.", 404, "NOT_FOUND");
    }

    const contentType = req.headers.get("content-type") ?? "";
    let fields: Record<string, string> = {};
    let newPhoto: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      for (const [key, value] of formData.entries()) {
        if (typeof value === "string" && key !== "photo") fields[key] = value;
      }

      const file = formData.get("photo") as File | null;
      if (file?.size) {
        // Delete old local photo before replacing
        if (testimonial.photo && storage.isLocalUpload(testimonial.photo)) {
          await storage.delete(testimonial.photo);
        }
        newPhoto = await savePhoto(file);
        logger.debug(CTX, "updateTestimonial — photo replaced", { newPhoto });
      } else if (fields.photoUrl !== undefined) {
        newPhoto = fields.photoUrl || undefined;
      }
    } else {
      fields = await req.json() as Record<string, string>;
      if (fields.photo    !== undefined) newPhoto = fields.photo    || undefined;
      if (fields.photoUrl !== undefined) newPhoto = fields.photoUrl || undefined;
    }

    await testimonial.update({
      ...(newPhoto               !== undefined && { photo:        newPhoto }),
      ...(fields.rating          !== undefined && { rating:       Number(fields.rating) }),
      ...(fields.quote           !== undefined && { quote:        fields.quote.trim() }),
      ...(fields.authorName      !== undefined && { authorName:   fields.authorName.trim() }),
      ...(fields.authorTitle     !== undefined && { authorTitle:  fields.authorTitle.trim()  || null }),
      ...(fields.displayOrder    !== undefined && { displayOrder: Number(fields.displayOrder) }),
      ...(fields.isActive        !== undefined && { isActive:     fields.isActive !== "false" }),
    });

    logger.info(CTX, "updateTestimonial — updated", { id });
    return NextResponse.json({ success: true, data: testimonial }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "updateTestimonial — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── PATCH /api/ui/testimonials/:id/toggle ────────────────────────────────────
export async function toggleTestimonial(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "toggleTestimonial — start", { id });

  try {
    if (!id) throw new AppError("Testimonial ID is required.", 400, "MISSING_ID");

    const testimonial = await Testimonial.findByPk(id);
    if (!testimonial) throw new AppError("Testimonial not found.", 404, "NOT_FOUND");

    await testimonial.update({ isActive: !testimonial.isActive });

    logger.info(CTX, "toggleTestimonial — toggled", { id, isActive: testimonial.isActive });

    return NextResponse.json(
      {
        success: true,
        message: `Testimonial is now ${testimonial.isActive ? "active" : "inactive"}.`,
        data: { id: testimonial.id, isActive: testimonial.isActive },
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error(CTX, "toggleTestimonial — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── DELETE /api/ui/testimonials/:id ─────────────────────────────────────────
export async function deleteTestimonial(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "deleteTestimonial — start", { id });

  try {
    if (!id) throw new AppError("Testimonial ID is required.", 400, "MISSING_ID");

    const testimonial = await Testimonial.findByPk(id);
    if (!testimonial) {
      logger.warn(CTX, "deleteTestimonial — not found", { id });
      throw new AppError("Testimonial not found.", 404, "NOT_FOUND");
    }

    // Delete photo from local storage if applicable
    if (testimonial.photo && storage.isLocalUpload(testimonial.photo)) {
      await storage.delete(testimonial.photo);
      logger.debug(CTX, "deleteTestimonial — photo deleted", { photo: testimonial.photo });
    }

    await testimonial.destroy();

    logger.info(CTX, "deleteTestimonial — deleted", { id });
    return NextResponse.json(
      { success: true, message: "Testimonial deleted." },
      { status: 200 },
    );
  } catch (error) {
    logger.error(CTX, "deleteTestimonial — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── PATCH /api/ui/testimonials/reorder ──────────────────────────────────────
// Body: [{ id, displayOrder }, ...]

export async function reorderTestimonials(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "reorderTestimonials — start");

  try {
    const body = await req.json() as { id: string; displayOrder: number }[];

    if (!Array.isArray(body) || body.length === 0) {
      throw new AppError(
        "Body must be a non-empty array of { id, displayOrder }.",
        400,
        "INVALID_BODY",
      );
    }

    await Promise.all(
      body.map(({ id, displayOrder }) =>
        Testimonial.update({ displayOrder }, { where: { id } }),
      ),
    );

    logger.info(CTX, "reorderTestimonials — done", { count: body.length });

    const updated = await Testimonial.findAll({
      order: [
        ["displayOrder", "ASC"],
        ["createdAt",    "ASC"],
      ],
    });

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "reorderTestimonials — failed", error);
    return errorResponse(error);
  }
}
