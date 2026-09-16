export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { toggleCategoryActive } from "@/features/productCategory/routes";

// PATCH /api/product-categories/:id/toggle-active  → flip isActive true ↔ false
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return toggleCategoryActive(req, id);
}
