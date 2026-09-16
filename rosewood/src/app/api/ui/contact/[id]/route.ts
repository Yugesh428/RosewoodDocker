export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import {
  getMessage,
  deleteMessage,
} from "@/features/Ui/contact/contactForm/contactController";

// GET    /api/ui/contact/:id — admin: get single message
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return getMessage(req, id);
}

// DELETE /api/ui/contact/:id — admin: delete message
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return deleteMessage(req, id);
}
