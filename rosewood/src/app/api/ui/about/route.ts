export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import {
  getAboutUs,
  updateAboutUs,
} from "@/features/Ui/AboutUsPage/AboutUs Head/aboutUsTitleController";

// GET /api/ui/about  — returns the about-us description (auto-creates if missing)
export async function GET(req: NextRequest) {
  return getAboutUs(req);
}

// PUT /api/ui/about  — admin: update description
export async function PUT(req: NextRequest) {
  return updateAboutUs(req);
}
