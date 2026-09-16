export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { toggleTestimonial } from "@/features/Ui/testimonials/testimonialsController";

// PATCH /api/ui/testimonials/:id/toggle — flip isActive
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return toggleTestimonial(req, id);
}
