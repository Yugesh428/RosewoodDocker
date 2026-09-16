export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getOrderById } from "@/features/orders/routes";

// GET /api/orders/:id  → single order with customer + items + products
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getOrderById(req, id);
}
