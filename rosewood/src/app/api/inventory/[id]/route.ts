export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getInventoryById, updateInventory } from "@/features/inventory/routes";

// GET /api/inventory/:id  → single batch with product + category join
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getInventoryById(req, id);
}

// PUT /api/inventory/:id  → update batch details (not quantity)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateInventory(req, id);
}
