export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getAllInventory, createInventory } from "@/features/inventory/routes";

// GET  /api/inventory  → list all batches (?productId, ?status, ?isActive, ?search, ?page, ?limit)
export async function GET(req: NextRequest) {
  return getAllInventory(req);
}

// POST /api/inventory  → add new batch
export async function POST(req: NextRequest) {
  return createInventory(req);
}
