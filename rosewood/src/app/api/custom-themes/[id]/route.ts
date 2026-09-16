export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import {
  updateCustomTheme,
  deleteCustomTheme,
} from "@/features/siteTheme/customThemeController";

// PUT  /api/custom-themes/:id  → update theme
export async function PUT(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return updateCustomTheme(req, id);
}

// DELETE  /api/custom-themes/:id  → delete theme
export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return deleteCustomTheme(req, id);
}
