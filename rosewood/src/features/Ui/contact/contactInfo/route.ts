// app/api/ui/contact-info/index.ts

export const CONTACT_INFO_ROUTES = {
  get: "GET  /api/ui/contact-info",
  update: "PUT  /api/ui/contact-info",
} as const;

export { getContactInfo, updateContactInfo } from "./contactInfoController";
