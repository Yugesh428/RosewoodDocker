export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getOrderStats } from "@/features/orders/routes";

// GET /api/orders/stats  → admin dashboard summary (?dateFrom, ?dateTo)
export async function GET(req: NextRequest) {
  return getOrderStats(req);
}
