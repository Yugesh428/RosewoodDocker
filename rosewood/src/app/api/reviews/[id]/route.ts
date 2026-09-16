export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { updateReview, deleteReview } from "@/features/reviews/routes";

// PUT /api/reviews/:id  → update review
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateReview(req, id);
}

// DELETE /api/reviews/:id  → delete review
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return deleteReview(req, id);
}
