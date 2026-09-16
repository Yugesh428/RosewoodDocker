export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import {
  getValue,
  updateValue,
  deleteValue,
} from "@/features/Ui/AboutUsPage/ourValues/ourValuesController";

// GET    /api/ui/values/:id — get single value
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return getValue(req, id);
}

// PUT    /api/ui/values/:id — update value (multipart or JSON)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return updateValue(req, id);
}

// DELETE /api/ui/values/:id — delete value + icon cleanup
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return deleteValue(req, id);
}
