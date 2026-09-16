// app/api/ui/contact-info/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import {
  getContactInfo,
  updateContactInfo,
} from "../../../../features/Ui/contact/contactInfo/contactInfoController";

// GET  /api/ui/contact-info  → returns the contact info (auto‑creates)
export async function GET(req: NextRequest) {
  return getContactInfo(req);
}

// PUT  /api/ui/contact-info  → update contact info (auto‑creates if missing)
export async function PUT(req: NextRequest) {
  return updateContactInfo(req);
}
