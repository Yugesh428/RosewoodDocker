import { NextRequest, NextResponse } from "next/server";
import OurStory from "./ourStroyModel";
import { storage } from "@/lib/storage";
import { logger } from "@/lib/logger";
import { AppError, errorResponse } from "@/lib/apiError";

const CTX = "OurStoryController";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

// ─── GET /api/ui/our-story ────────────────────────────────────────────────────
// Public: returns the single story record.
// Auto-creates a blank default if none exists yet.

export async function getOurStory(_req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "getOurStory — start");

  try {
    let story = await OurStory.findOne();

    if (!story) {
      story = await OurStory.create({
        imageUrl:   null,
        title:      "Born from a Desire to Redefine the Pharmacy",
        paragraph1: "Rosewood Pharmacy was born from a desire to redefine the traditional pharmacy. We recognised a need for a space that seamlessly blends the rigorous standards of clinical care with the personalised, sensory experience of a high-end boutique.",
        paragraph2: "For over a decade, we have dedicated ourselves to sourcing the highest-quality pharmaceutical products, holistic remedies, and premium skincare. Our environment is designed to be an oasis of calm, where every consultation is handled with the utmost discretion and expertise.",
        paragraph3: "We believe that health and wellness are luxuries that everyone deserves. Our team of expert pharmacists and wellness consultants are here to guide you on your journey to optimal health, providing tailored advice and a curated selection of products you can trust.",
      });
      logger.info(CTX, "getOurStory — created default entry");
    }

    return NextResponse.json({ success: true, data: story }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getOurStory — failed", error);
    return errorResponse(error);
  }
}

// ─── PUT /api/ui/our-story ────────────────────────────────────────────────────
// Admin: update title, paragraph1/2/3, and optionally replace the image.
// Accepts multipart/form-data (with image file) or JSON.

export async function updateOurStory(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "updateOurStory — start");

  try {
    let story = await OurStory.findOne();
    if (!story) {
      story = await OurStory.create({
        imageUrl:   null,
        title:      "",
        paragraph1: "",
        paragraph2: null,
        paragraph3: null,
      });
      logger.info(CTX, "updateOurStory — created new entry");
    }

    const contentType = req.headers.get("content-type") ?? "";
    let fields: Record<string, string> = {};
    let newImageUrl: string | null | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      for (const [key, value] of formData.entries()) {
        if (typeof value === "string" && key !== "image") fields[key] = value;
      }

      const file = formData.get("image") as File | null;
      if (file?.size) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          throw new AppError(
            `Invalid file type "${file.type}". Allowed: ${ALLOWED_TYPES.join(", ")}.`,
            400, "INVALID_FILE_TYPE",
          );
        }
        if (file.size > MAX_FILE_SIZE) {
          throw new AppError("Image must not exceed 5 MB.", 400, "FILE_TOO_LARGE");
        }
        // Delete old local image before replacing
        if (story.imageUrl && storage.isLocalUpload(story.imageUrl)) {
          await storage.delete(story.imageUrl);
        }
        const result = await storage.save(file, "about/story");
        newImageUrl = result.url;
        logger.debug(CTX, "updateOurStory — image replaced", { newImageUrl });
      } else if (fields.imageUrl !== undefined) {
        newImageUrl = fields.imageUrl || null;
      }
    } else {
      fields = await req.json() as Record<string, string>;
      if (fields.imageUrl !== undefined) newImageUrl = fields.imageUrl || null;
    }

    // Validate non-empty on required fields if being updated
    if (fields.title !== undefined && !fields.title.trim()) {
      throw new AppError("title cannot be empty.", 400, "INVALID_TITLE");
    }
    if (fields.paragraph1 !== undefined && !fields.paragraph1.trim()) {
      throw new AppError("paragraph1 cannot be empty.", 400, "INVALID_PARAGRAPH");
    }

    await story.update({
      ...(newImageUrl    !== undefined && { imageUrl:   newImageUrl }),
      ...(fields.title      !== undefined && { title:      fields.title.trim() }),
      ...(fields.paragraph1 !== undefined && { paragraph1: fields.paragraph1.trim() }),
      ...(fields.paragraph2 !== undefined && { paragraph2: fields.paragraph2.trim() || null }),
      ...(fields.paragraph3 !== undefined && { paragraph3: fields.paragraph3.trim() || null }),
    });

    logger.info(CTX, "updateOurStory — updated");
    return NextResponse.json({ success: true, data: story }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "updateOurStory — failed", error);
    return errorResponse(error);
  }
}
