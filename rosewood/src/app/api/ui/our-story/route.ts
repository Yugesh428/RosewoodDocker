export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import {
  getOurStory,
  updateOurStory,
} from "@/features/Ui/AboutUsPage/ourStory/ourStoryController";

// GET /api/ui/our-story  — returns the story record (auto-creates if missing)
export async function GET(req: NextRequest) {
  return getOurStory(req);
}

// PUT /api/ui/our-story  — admin: update title, paragraphs, image (multipart or JSON)
export async function PUT(req: NextRequest) {
  return updateOurStory(req);
}
