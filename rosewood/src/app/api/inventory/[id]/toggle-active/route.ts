export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { toggleInventoryActive } from "@/features/inventory/routes";

// PATCH /api/inventory/:id/toggle-active  → flip isActive true ↔ false
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return toggleInventoryActive(req, id);
}
