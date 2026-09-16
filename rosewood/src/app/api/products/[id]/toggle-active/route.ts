export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { toggleProductActive } from "@/features/products/routes";

// PATCH /api/products/:id/toggle-active  → flip isActive true ↔ false
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return toggleProductActive(req, id);
}
