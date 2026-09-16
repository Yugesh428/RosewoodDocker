/**
 * Contact Info Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * Base: /api/ui/contact-info
 *
 * ┌─────────────────────────────────────────────────────┬────────────────────┐
 * │ Endpoint                                            │ Handler            │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ GET  /api/ui/contact-info                           │ getContactInfo     │
 * │      Returns the single contact info record.        │                    │
 * │      Auto-creates with defaults if none exists.     │                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ PUT  /api/ui/contact-info                           │ updateContactInfo  │
 * │      Body: { address?, phone?, email?, hours? }     │                    │
 * └─────────────────────────────────────────────────────┴────────────────────┘
 *
 * UI mapping (contact page right column):
 *   address → "123 Apothecary Lane, Suite 100, New York, NY 10001"
 *   phone   → "+1 (212) 555-0199"
 *   email   → "concierge@rosewoodpharmacy.com"
 *   hours   → multi-line string e.g.
 *             "Monday – Friday: 9:00 AM – 7:00 PM\nSaturday: ..."
 *
 * Notes:
 * - Single-row table — only one record ever exists (upsert pattern)
 * - All fields are required on the record but optional on PUT (patch-style update)
 * - hours is stored as plain text with \n line breaks
 */

export const CONTACT_INFO_ROUTES = {
  get:    "GET /api/ui/contact-info",
  update: "PUT /api/ui/contact-info",
} as const;

export { getContactInfo, updateContactInfo } from "./contactInfoController";
