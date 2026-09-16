export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import {
  updateHeroSlide,
  deleteHeroSlide,
} from "@/features/Ui/HeroSection/heroModel/heroController";

// PUT    /api/ui/hero/:id    — admin: update slide text / replace image
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return updateHeroSlide(req, id);
}

// DELETE /api/ui/hero/:id   — admin: delete slide + image
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return deleteHeroSlide(req, id);
}
