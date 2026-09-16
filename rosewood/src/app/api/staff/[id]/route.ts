export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getStaffById, updateStaff, deleteStaff } from "@/features/staff/routes";

// GET /api/staff/:id  → single staff member
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getStaffById(req, id);
}

// PUT /api/staff/:id  → update staff record
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateStaff(req, id);
}

// DELETE /api/staff/:id  → permanently delete staff member
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return deleteStaff(req, id);
}
