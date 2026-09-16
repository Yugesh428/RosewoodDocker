export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { updateOrderStatus } from "@/features/orders/routes";

// PATCH /api/orders/:id/status  → advance or cancel order
// Automatically deducts stock on "delivered", restores on "cancelled"
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateOrderStatus(req, id);
}
