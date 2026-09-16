export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getItemsByOrder, addOrderItem } from "@/features/orderItems/routes";

// GET  /api/order-items?orderId=:id  → all items for an order
export async function GET(req: NextRequest) {
  return getItemsByOrder(req);
}

// POST /api/order-items  → add a new item to a pending order
export async function POST(req: NextRequest) {
  return addOrderItem(req);
}
