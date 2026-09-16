export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getReviewsByCustomer } from "@/features/reviews/routes";

// GET /api/reviews/customer/:customerId  → all reviews by a customer
export async function GET(req: NextRequest, { params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params;
  return getReviewsByCustomer(req, customerId);
}
