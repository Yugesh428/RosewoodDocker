export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import {
  getContactInfo,
  updateContactInfo,
} from "@/features/Ui/contact/contactInfo/contactInfoController";

// GET /api/ui/contact-info  — returns contact info (auto-creates defaults if missing)
export async function GET(req: NextRequest) {
  return getContactInfo(req);
}

// PUT /api/ui/contact-info  — admin: update address, phone, email, hours, lat/lng
export async function PUT(req: NextRequest) {
  return updateContactInfo(req);
}
