export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getAllReviews } from "@/features/reviews/reviewController";

// GET /api/reviews/admin  → all reviews for admin panel (paginated, searchable)
export async function GET(req: NextRequest) {
  return getAllReviews(req);
}
