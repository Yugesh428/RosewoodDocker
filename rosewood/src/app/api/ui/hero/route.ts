export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import {
  getHeroSlides,
  createHeroSlide,
  reorderHeroSlides,
} from "@/features/Ui/HeroSection/heroModel/heroController";

// GET  /api/ui/hero          — public (active only) | admin (?all=true)
export async function GET(req: NextRequest) {
  return getHeroSlides(req);
}

// POST /api/ui/hero          — admin: create slide (multipart/form-data or JSON)
export async function POST(req: NextRequest) {
  return createHeroSlide(req);
}

// PATCH /api/ui/hero/reorder — admin: reorder slides
// NOTE: Next.js matches /reorder before /[id], so this must live here
export async function PATCH(req: NextRequest) {
  return reorderHeroSlides(req);
}
