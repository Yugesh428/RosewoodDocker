// app/api/ui/mission/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import {
  getMission,
  updateMission,
} from "../../../../features/Ui/AboutUsPage/ourMisson/missionController";

// GET  /api/ui/mission  → returns the mission (auto‑creates)
export async function GET(req: NextRequest) {
  return getMission(req);
}

// PUT  /api/ui/mission  → update subtitle & description
export async function PUT(req: NextRequest) {
  return updateMission(req);
}
