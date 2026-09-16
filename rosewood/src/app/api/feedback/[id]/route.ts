export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getFeedbackById, deleteFeedback } from "@/features/feedback/routes";

// GET /api/feedback/:id  → single feedback
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getFeedbackById(req, id);
}

// DELETE /api/feedback/:id  → delete feedback
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return deleteFeedback(req, id);
}
