export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import {
  getMessages,
  createMessage,
} from "../../../features/Ui/contact/contactForm/contactController";

// GET  /api/ui/contact  → list messages (admin only, protect via middleware)
export async function GET(req: NextRequest) {
  return getMessages(req);
}

// POST /api/ui/contact  → submit a new contact message (public)
export async function POST(req: NextRequest) {
  return createMessage(req);
}
