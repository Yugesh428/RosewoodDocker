export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import {
  getMessages,
  createMessage,
} from "@/features/Ui/contact/contactForm/contactController";

// GET  /api/ui/contact          — admin: list messages (?read=true|false optional)
export async function GET(req: NextRequest) {
  return getMessages(req);
}

// POST /api/ui/contact          — public: submit a contact message
export async function POST(req: NextRequest) {
  return createMessage(req);
}
