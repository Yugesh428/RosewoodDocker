export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getReviewsByProduct, createReview } from "@/features/reviews/routes";

// GET /api/reviews?productId=:id  → all reviews for a product with stats
export async function GET(req: NextRequest) {
  return getReviewsByProduct(req);
}

// POST /api/reviews  → create a new review
export async function POST(req: NextRequest) {
  return createReview(req);
}
