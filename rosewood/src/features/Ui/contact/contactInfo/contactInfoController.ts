import { NextRequest, NextResponse } from "next/server";
import ContactInfo from "./contactInfoModel";
import { logger } from "@/lib/logger";
import { AppError, errorResponse } from "@/lib/apiError";

const CTX = "ContactInfoController";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── GET /api/ui/contact-info ─────────────────────────────────────────────────
// Public: returns the single contact info record.
// Auto-creates with defaults if none exists yet.

export async function getContactInfo(_req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "getContactInfo — start");

  try {
    let contactInfo = await ContactInfo.findOne();

    if (!contactInfo) {
      contactInfo = await ContactInfo.create({
        address:   "123 Apothecary Lane, Suite 100, New York, NY 10001",
        phone:     "+1 (212) 555-0199",
        email:     "concierge@rosewoodpharmacy.com",
        hours:     "Monday – Friday: 9:00 AM – 7:00 PM\nSaturday: 10:00 AM – 5:00 PM\nSunday: Closed",
        latitude:  40.7165,
        longitude: -74.0005,
      });
      logger.info(CTX, "getContactInfo — created default entry");
    }

    return NextResponse.json({ success: true, data: contactInfo }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getContactInfo — failed", error);
    return errorResponse(error);
  }
}

// ─── PUT /api/ui/contact-info ─────────────────────────────────────────────────
// Admin: update any contact info fields (all optional — only send what changed)
// Body: { address?, phone?, email?, hours?, latitude?, longitude? }

export async function updateContactInfo(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "updateContactInfo — start");

  try {
    const body = await req.json() as Record<string, string | number>;
    const { address, phone, email, hours, latitude, longitude } = body;

    // Validations
    if (address !== undefined && !String(address).trim())
      throw new AppError("address cannot be empty.", 400, "INVALID_ADDRESS");
    if (phone !== undefined && !String(phone).trim())
      throw new AppError("phone cannot be empty.", 400, "INVALID_PHONE");
    if (email !== undefined) {
      if (!String(email).trim())
        throw new AppError("email cannot be empty.", 400, "INVALID_EMAIL");
      if (!EMAIL_REGEX.test(String(email).trim()))
        throw new AppError("Invalid email address.", 400, "INVALID_EMAIL");
    }
    if (hours !== undefined && !String(hours).trim())
      throw new AppError("hours cannot be empty.", 400, "INVALID_HOURS");
    if (latitude !== undefined) {
      const lat = Number(latitude);
      if (isNaN(lat) || lat < -90 || lat > 90)
        throw new AppError("latitude must be a number between -90 and 90.", 400, "INVALID_LATITUDE");
    }
    if (longitude !== undefined) {
      const lng = Number(longitude);
      if (isNaN(lng) || lng < -180 || lng > 180)
        throw new AppError("longitude must be a number between -180 and 180.", 400, "INVALID_LONGITUDE");
    }

    let contactInfo = await ContactInfo.findOne();
    if (!contactInfo) {
      contactInfo = await ContactInfo.create({
        address:   String(address ?? "").trim(),
        phone:     String(phone   ?? "").trim(),
        email:     String(email   ?? "").trim(),
        hours:     String(hours   ?? "").trim(),
        latitude:  latitude  !== undefined ? Number(latitude)  : null,
        longitude: longitude !== undefined ? Number(longitude) : null,
      });
      logger.info(CTX, "updateContactInfo — created new entry");
    } else {
      await contactInfo.update({
        ...(address   !== undefined && { address:   String(address).trim() }),
        ...(phone     !== undefined && { phone:     String(phone).trim() }),
        ...(email     !== undefined && { email:     String(email).trim().toLowerCase() }),
        ...(hours     !== undefined && { hours:     String(hours).trim() }),
        ...(latitude  !== undefined && { latitude:  Number(latitude) }),
        ...(longitude !== undefined && { longitude: Number(longitude) }),
      });
    }

    logger.info(CTX, "updateContactInfo — updated");
    return NextResponse.json({ success: true, data: contactInfo }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "updateContactInfo — failed", error);
    return errorResponse(error);
  }
}
