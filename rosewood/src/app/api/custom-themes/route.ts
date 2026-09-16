export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import {
  getAllCustomThemes,
  createCustomTheme,
} from "@/features/siteTheme/customThemeController";

// GET  /api/custom-themes  → fetch all themes
export async function GET(req: NextRequest) {
  return getAllCustomThemes(req);
}

// POST  /api/custom-themes  → create new custom theme
export async function POST(req: NextRequest) {
  return createCustomTheme(req);
}
