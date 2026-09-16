export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { toggleHeroSlide } from "@/features/Ui/HeroSection/heroModel/heroController";

// PATCH /api/ui/hero/:id/toggle — admin: flip isActive true ↔ false
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return toggleHeroSlide(req, id);
}
