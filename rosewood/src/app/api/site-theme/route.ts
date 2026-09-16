export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getTheme, updateTheme } from "@/features/siteTheme/siteThemeController";

// GET  /api/site-theme  → returns active theme
export async function GET(req: NextRequest) {
  return getTheme(req);
}

// PUT  /api/site-theme  → { activeTheme: "gold" | "medical" }
export async function PUT(req: NextRequest) {
  return updateTheme(req);
}
