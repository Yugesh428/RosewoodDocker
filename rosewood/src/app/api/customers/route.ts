export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getAllCustomers } from "@/features/customers/routes";

// GET /api/customers  → list all customers (?isActive, ?search, ?page, ?limit)
export async function GET(req: NextRequest) {
  return getAllCustomers(req);
}
