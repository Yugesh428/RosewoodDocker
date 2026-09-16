export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getCustomerWithOrders } from "@/features/customers/routes";

// GET /api/customers/:id/orders  → customer profile + order history + spend stats
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getCustomerWithOrders(req, id);
}
