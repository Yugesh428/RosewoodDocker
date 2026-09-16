export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getOrderItemById, removeOrderItem } from "@/features/orderItems/routes";

// GET    /api/order-items/:id  → single order item with product + inventory joins
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getOrderItemById(req, id);
}

// DELETE /api/order-items/:id  → remove item from a pending order
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return removeOrderItem(req, id);
}
