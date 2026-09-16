export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getCustomerStats } from "@/features/customers/routes";

// GET /api/customers/stats  → total / active / inactive counts
export async function GET(req: NextRequest) {
  return getCustomerStats(req);
}
