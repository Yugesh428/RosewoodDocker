export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getAllOrders, createOrder } from "@/features/orders/routes";

// GET  /api/orders  → list all orders (?customerId, ?orderStatus, ?paymentStatus, ?search, ?dateFrom, ?dateTo, ?page, ?limit)
export async function GET(req: NextRequest) {
  return getAllOrders(req);
}

// POST /api/orders  → create new order
export async function POST(req: NextRequest) {
  return createOrder(req);
}
