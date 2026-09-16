export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { updateFeedbackStatus } from "@/features/feedback/routes";

// PATCH /api/feedback/:id/status  → admin updates status + notes
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateFeedbackStatus(req, id);
}
