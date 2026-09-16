export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import {
  getTestimonials,
  createTestimonial,
  reorderTestimonials,
} from "@/features/Ui/testimonials/testimonialsController";

// GET   /api/ui/testimonials          — public (active) | admin (?all=true)
export async function GET(req: NextRequest) {
  return getTestimonials(req);
}

// POST  /api/ui/testimonials          — admin: create (multipart or JSON)
export async function POST(req: NextRequest) {
  return createTestimonial(req);
}

// PATCH /api/ui/testimonials/reorder  — admin: reorder (body: [{id, displayOrder}])
export async function PATCH(req: NextRequest) {
  return reorderTestimonials(req);
}
