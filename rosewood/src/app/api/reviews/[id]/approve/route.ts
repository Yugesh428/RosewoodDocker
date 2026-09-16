export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { approveReview } from "@/features/reviews/routes";

// PATCH /api/reviews/:id/approve  → admin approves review
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return approveReview(req, id);
}
