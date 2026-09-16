export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { toggleRead } from "../../../../../features/Ui/contact/contactForm/contactController";

// PATCH /api/ui/contact/:id/read  → toggle read/unread (admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return toggleRead(req, id);
}
