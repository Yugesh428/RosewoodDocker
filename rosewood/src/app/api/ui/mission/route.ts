export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import {
  getMission,
  updateMission,
} from "@/features/Ui/AboutUsPage/ourMisson/missionController";

// GET /api/ui/mission  — returns the mission record (auto-creates if missing)
export async function GET(req: NextRequest) {
  return getMission(req);
}

// PUT /api/ui/mission  — admin: update subtitle & description
export async function PUT(req: NextRequest) {
  return updateMission(req);
}
