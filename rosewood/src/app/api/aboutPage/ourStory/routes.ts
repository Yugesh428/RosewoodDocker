// app/api/ui/our-story/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import {
  getOurStory,
  updateOurStory,
} from "../../../../features/Ui/AboutUsPage/ourStory/ourStoryController";

// GET  /api/ui/our-story  → returns the story (auto‑creates)
export async function GET(req: NextRequest) {
  return getOurStory(req);
}

// PUT  /api/ui/our-story  → update title, content, and optionally image
export async function PUT(req: NextRequest) {
  return updateOurStory(req);
}
