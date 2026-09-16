import { NextRequest, NextResponse } from "next/server";
import Value from "./ourValuesModel";
import { storage } from "@/lib/storage";
import { logger } from "@/lib/logger";
import { AppError, errorResponse } from "@/lib/apiError";

const CTX = "ValuesController";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB (icons are small)
const ALLOWED_TYPES = [
  "image/svg+xml",  // SVG icons
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

// ─── Helper: validate + save icon/image ───────────────────────────────────────
async function saveIcon(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new AppError(
      `Invalid file type "${file.type}". Allowed: ${ALLOWED_TYPES.join(", ")}.`,
      400,
      "INVALID_FILE_TYPE",
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new AppError("Icon must not exceed 2 MB.", 400, "FILE_TOO_LARGE");
  }
  const result = await storage.save(file, "about/values");
  return result.url;
}

// ─── GET /api/ui/values ───────────────────────────────────────────────────────
// Public: active values only  |  Admin: ?all=true

export async function getValues(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "getValues — start");

  try {
    const showAll = new URL(req.url).searchParams.get("all") === "true";
    const where = showAll ? {} : { isActive: true };

    const values = await Value.findAll({
      where,
      order: [
        ["displayOrder", "ASC"],
        ["createdAt",    "ASC"],
      ],
    });

    logger.info(CTX, `getValues — ${values.length} items`);
    return NextResponse.json({ success: true, data: values }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getValues — failed", error);
    return errorResponse(error);
  }
}

// ─── GET /api/ui/values/:id ───────────────────────────────────────────────────
export async function getValue(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "getValue — start", { id });

  try {
    if (!id) throw new AppError("Value ID is required.", 400, "MISSING_ID");

    const value = await Value.findByPk(id);
    if (!value) {
      logger.warn(CTX, "getValue — not found", { id });
      throw new AppError("Value not found.", 404, "NOT_FOUND");
    }

    return NextResponse.json({ success: true, data: value }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getValue — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── POST /api/ui/values ──────────────────────────────────────────────────────
// Admin: create a value card
// multipart/form-data: image (SVG/PNG/JPG file) OR imageUrl,
//                      title (required), description (required),
//                      displayOrder?, isActive?

export async function createValue(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "createValue — start");

  try {
    const contentType = req.headers.get("content-type") ?? "";
    let fields: Record<string, string> = {};
    let imageUrl: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      for (const [key, value] of formData.entries()) {
        if (typeof value === "string" && key !== "image") fields[key] = value;
      }

      const file = formData.get("image") as File | null;
      if (file?.size) {
        imageUrl = await saveIcon(file);
        logger.debug(CTX, "createValue — icon saved", { imageUrl });
      } else if (fields.imageUrl) {
        imageUrl = fields.imageUrl;
      }
    } else {
      const body = await req.json() as Record<string, string>;
      fields   = body;
      imageUrl = body.imageUrl ?? null;
    }

    const { title, description, displayOrder, isActive } = fields;

    if (!title?.trim())
      throw new AppError("title is required.", 400, "MISSING_TITLE");
    if (!description?.trim())
      throw new AppError("description is required.", 400, "MISSING_DESCRIPTION");

    const value = await Value.create({
      title:        title.trim(),
      description:  description.trim(),
      imageUrl,
      displayOrder: displayOrder ? Number(displayOrder) : 0,
      isActive:     isActive !== undefined ? isActive !== "false" : true,
    });

    logger.info(CTX, "createValue — created", { id: value.id });
    return NextResponse.json({ success: true, data: value }, { status: 201 });
  } catch (error) {
    logger.error(CTX, "createValue — failed", error);
    return errorResponse(error);
  }
}

// ─── PUT /api/ui/values/:id ───────────────────────────────────────────────────
// Admin: update a value card (multipart/form-data or JSON)

export async function updateValue(
  req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "updateValue — start", { id });

  try {
    if (!id) throw new AppError("Value ID is required.", 400, "MISSING_ID");

    const value = await Value.findByPk(id);
    if (!value) {
      logger.warn(CTX, "updateValue — not found", { id });
      throw new AppError("Value not found.", 404, "NOT_FOUND");
    }

    const contentType = req.headers.get("content-type") ?? "";
    let fields: Record<string, string> = {};
    let newImageUrl: string | null | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      for (const [key, val] of formData.entries()) {
        if (typeof val === "string" && key !== "image") fields[key] = val;
      }

      const file = formData.get("image") as File | null;
      if (file?.size) {
        // Delete old local icon before replacing
        if (value.imageUrl && storage.isLocalUpload(value.imageUrl)) {
          await storage.delete(value.imageUrl);
        }
        newImageUrl = await saveIcon(file);
        logger.debug(CTX, "updateValue — icon replaced", { newImageUrl });
      } else if (fields.imageUrl !== undefined) {
        newImageUrl = fields.imageUrl || null;
      }
    } else {
      fields = await req.json() as Record<string, string>;
      if (fields.imageUrl !== undefined) newImageUrl = fields.imageUrl || null;
    }

    await value.update({
      ...(newImageUrl           !== undefined && { imageUrl:     newImageUrl }),
      ...(fields.title          !== undefined && { title:        fields.title.trim() }),
      ...(fields.description    !== undefined && { description:  fields.description.trim() }),
      ...(fields.displayOrder   !== undefined && { displayOrder: Number(fields.displayOrder) }),
      ...(fields.isActive       !== undefined && { isActive:     fields.isActive !== "false" }),
    });

    logger.info(CTX, "updateValue — updated", { id });
    return NextResponse.json({ success: true, data: value }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "updateValue — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── PATCH /api/ui/values/:id/toggle ─────────────────────────────────────────
export async function toggleValue(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "toggleValue — start", { id });

  try {
    if (!id) throw new AppError("Value ID is required.", 400, "MISSING_ID");

    const value = await Value.findByPk(id);
    if (!value) throw new AppError("Value not found.", 404, "NOT_FOUND");

    await value.update({ isActive: !value.isActive });

    logger.info(CTX, "toggleValue — toggled", { id, isActive: value.isActive });

    return NextResponse.json(
      {
        success: true,
        message: `Value is now ${value.isActive ? "active" : "inactive"}.`,
        data: { id: value.id, isActive: value.isActive },
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error(CTX, "toggleValue — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── DELETE /api/ui/values/:id ────────────────────────────────────────────────
// Deletes the value and its icon from storage

export async function deleteValue(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "deleteValue — start", { id });

  try {
    if (!id) throw new AppError("Value ID is required.", 400, "MISSING_ID");

    const value = await Value.findByPk(id);
    if (!value) {
      logger.warn(CTX, "deleteValue — not found", { id });
      throw new AppError("Value not found.", 404, "NOT_FOUND");
    }

    if (value.imageUrl && storage.isLocalUpload(value.imageUrl)) {
      await storage.delete(value.imageUrl);
      logger.debug(CTX, "deleteValue — icon deleted", { imageUrl: value.imageUrl });
    }

    await value.destroy();

    logger.info(CTX, "deleteValue — deleted", { id });
    return NextResponse.json(
      { success: true, message: "Value deleted." },
      { status: 200 },
    );
  } catch (error) {
    logger.error(CTX, "deleteValue — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── PATCH /api/ui/values/reorder ────────────────────────────────────────────
// Body: [{ id, displayOrder }, ...]

export async function reorderValues(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "reorderValues — start");

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
        Value.update({ displayOrder }, { where: { id } }),
      ),
    );

    logger.info(CTX, "reorderValues — done", { count: body.length });

    const updated = await Value.findAll({
      order: [
        ["displayOrder", "ASC"],
        ["createdAt",    "ASC"],
      ],
    });

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "reorderValues — failed", error);
    return errorResponse(error);
  }
}
