/**
 * Contact Form Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * Base: /api/ui/contact
 *
 * ┌─────────────────────────────────────────────────────┬────────────────────┐
 * │ Endpoint                                            │ Handler            │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ GET    /api/ui/contact                              │ getMessages        │
 * │        ?read=true|false  (optional filter)          │                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ GET    /api/ui/contact/:id                          │ getMessage         │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ POST   /api/ui/contact                              │ createMessage      │
 * │        Body: { fullName, email, phone?, message }   │                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ PATCH  /api/ui/contact/:id/read                     │ toggleRead         │
 * │        Flips isRead: true↔false                     │                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ DELETE /api/ui/contact/:id                          │ deleteMessage      │
 * └─────────────────────────────────────────────────────┴────────────────────┘
 *
 * Notes:
 * - POST is public (submitted by site visitors)
 * - GET / PATCH / DELETE are admin only
 * - phone is optional
 * - isRead defaults to false on creation
 * - messages sorted newest first
 */

export const CONTACT_ROUTES = {
  list:    "GET    /api/ui/contact",
  getById: "GET    /api/ui/contact/:id",
  create:  "POST   /api/ui/contact",
  toggle:  "PATCH  /api/ui/contact/:id/read",
  delete:  "DELETE /api/ui/contact/:id",
} as const;

export {
  getMessages,
  getMessage,
  createMessage,
  toggleRead,
  deleteMessage,
} from "./contactController";
