// app/api/ui/about/aboutController.ts

import { NextRequest, NextResponse } from "next/server";
import AboutUs from "./aboutUsTitleModel";
import { logger } from "@/lib/logger";
import { AppError, errorResponse } from "@/lib/apiError";

const CTX = "AboutController";

// ─── GET /api/ui/about ──────────────────────────────────────────────
// Public: returns the single about‑us entry (or creates a default if none exists)

export async function getAboutUs(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "getAboutUs — start");

  try {
    // There should be only one record; we'll fetch the first one
    let about = await AboutUs.findOne();

    // If none exists, create a default empty one (so frontend never gets 404)
    if (!about) {
      about = await AboutUs.create({ description: "" });
      logger.info(CTX, "getAboutUs — created default entry");
    }

    logger.info(CTX, "getAboutUs — success");
    return NextResponse.json({ success: true, data: about }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getAboutUs — failed", error);
    return errorResponse(error);
  }
}

// ─── PUT /api/ui/about ──────────────────────────────────────────────
// Admin: update the description
// Body: { description: string }

export async function updateAboutUs(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "updateAboutUs — start");

  try {
    const body = await req.json();
    const { description } = body;

    if (!description?.trim()) {
      throw new AppError(
        "description is required.",
        400,
        "MISSING_DESCRIPTION",
      );
    }

    // Find the single record (or create if missing)
    let about = await AboutUs.findOne();
    if (!about) {
      about = await AboutUs.create({ description: description.trim() });
      logger.info(CTX, "updateAboutUs — created new entry");
    } else {
      await about.update({ description: description.trim() });
    }

    logger.info(CTX, "updateAboutUs — updated");
    return NextResponse.json({ success: true, data: about }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "updateAboutUs — failed", error);
    return errorResponse(error);
  }
}
