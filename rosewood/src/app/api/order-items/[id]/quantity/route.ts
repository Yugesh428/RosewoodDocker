export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { updateOrderItemQuantity } from "@/features/orderItems/routes";

// PATCH /api/order-items/:id/quantity  → update item quantity on a pending order
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateOrderItemQuantity(req, id);
}
