export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getAllFeedback, createFeedback } from "@/features/feedback/routes";

// GET /api/feedback  → admin view all feedback
export async function GET(req: NextRequest) {
  return getAllFeedback(req);
}

// POST /api/feedback  → submit feedback (guest or customer)
export async function POST(req: NextRequest) {
  return createFeedback(req);
}
