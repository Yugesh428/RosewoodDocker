export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import {
  getTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "@/features/Ui/testimonials/testimonialsController";

// GET    /api/ui/testimonials/:id — get single
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return getTestimonial(req, id);
}

// PUT    /api/ui/testimonials/:id — update (multipart or JSON)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return updateTestimonial(req, id);
}

// DELETE /api/ui/testimonials/:id — delete + photo cleanup
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return deleteTestimonial(req, id);
}
