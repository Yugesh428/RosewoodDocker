export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import {
  getValues,
  createValue,
  reorderValues,
} from "@/features/Ui/AboutUsPage/ourValues/ourValuesController";

// GET   /api/ui/values          — public (active) | admin (?all=true)
export async function GET(req: NextRequest) {
  return getValues(req);
}

// POST  /api/ui/values          — admin: create value card (multipart or JSON)
export async function POST(req: NextRequest) {
  return createValue(req);
}

// PATCH /api/ui/values/reorder  — admin: reorder value cards
export async function PATCH(req: NextRequest) {
  return reorderValues(req);
}
