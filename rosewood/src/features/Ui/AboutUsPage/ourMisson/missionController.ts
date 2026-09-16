import { NextRequest, NextResponse } from "next/server";
import Mission from "./missionModel";
import { logger } from "@/lib/logger";
import { AppError, errorResponse } from "@/lib/apiError";

const CTX = "MissionController";

// ─── GET /api/ui/mission ──────────────────────────────────────────────────────
// Public: returns the single mission record.
// Auto-creates with defaults if none exists yet.

export async function getMission(_req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "getMission — start");

  try {
    let mission = await Mission.findOne();

    if (!mission) {
      mission = await Mission.create({
        subtitle:    "A Higher Standard of Care",
        description: "To provide an unparalleled standard of healthcare and wellness guidance in an environment that inspires confidence, safety, and elegance.",
      });
      logger.info(CTX, "getMission — created default entry");
    }

    return NextResponse.json({ success: true, data: mission }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getMission — failed", error);
    return errorResponse(error);
  }
}

// ─── PUT /api/ui/mission ──────────────────────────────────────────────────────
// Admin: update subtitle (heading) and description (quote text).
// Body: { subtitle?, description? }

export async function updateMission(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "updateMission — start");

  try {
    const body = await req.json() as Record<string, string>;
    const { subtitle, description } = body;

    if (subtitle !== undefined && !subtitle.trim()) {
      throw new AppError("subtitle cannot be empty.", 400, "INVALID_SUBTITLE");
    }
    if (description !== undefined && !description.trim()) {
      throw new AppError("description cannot be empty.", 400, "INVALID_DESCRIPTION");
    }

    let mission = await Mission.findOne();
    if (!mission) {
      mission = await Mission.create({
        subtitle:    subtitle?.trim()    || "A Higher Standard of Care",
        description: description?.trim() || "",
      });
      logger.info(CTX, "updateMission — created new entry");
    } else {
      await mission.update({
        ...(subtitle    !== undefined && { subtitle:    subtitle.trim() }),
        ...(description !== undefined && { description: description.trim() }),
      });
    }

    logger.info(CTX, "updateMission — updated");
    return NextResponse.json({ success: true, data: mission }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "updateMission — failed", error);
    return errorResponse(error);
  }
}
