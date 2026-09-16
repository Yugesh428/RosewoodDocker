export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { toggleValue } from "@/features/Ui/AboutUsPage/ourValues/ourValuesController";

// PATCH /api/ui/values/:id/toggle — flip isActive
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return toggleValue(req, id);
}
