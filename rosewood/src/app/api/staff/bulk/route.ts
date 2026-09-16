export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { bulkCreateStaff } from "@/features/staff/routes";

// POST /api/staff/bulk  → bulk import from JSON array or Excel (.xlsx/.xls)
export async function POST(req: NextRequest) {
  return bulkCreateStaff(req);
}
