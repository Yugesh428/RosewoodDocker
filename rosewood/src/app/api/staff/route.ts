export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getAllStaff, createStaff } from "@/features/staff/routes";

// GET  /api/staff   → list all staff (?isActive, ?role, ?search, ?page, ?limit)
export async function GET(req: NextRequest) {
  return getAllStaff(req);
}

// POST /api/staff   → create a single staff member
export async function POST(req: NextRequest) {
  return createStaff(req);
}
