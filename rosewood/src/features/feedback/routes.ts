/**
 * Feedback Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * Base: /api/feedback
 *
 * Rules:
 *   - General feedback about the service/website (NOT tied to a specific product).
 *   - Guests can submit feedback (customerId nullable).
 *   - Status: pending → reviewed → resolved
 *
 * ┌──────────────────────────────────────────────────────┬────────────────────────────────┐
 * │ Endpoint                                             │ Handler                        │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ GET    /api/feedback                                 │ getAllFeedback                  │
 * │        ?status, ?page, ?limit                        │ Admin view                     │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ GET    /api/feedback/:id                             │ getFeedbackById                │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ POST   /api/feedback                                 │ createFeedback                 │
 * │        { customerId?, customerName?, customerEmail?, │ Anyone can submit              │
 * │          feedbackText }                              │                                │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ PATCH  /api/feedback/:id/status                      │ updateFeedbackStatus           │
 * │        { status, adminNotes? }                       │ Admin updates                  │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ DELETE /api/feedback/:id                             │ deleteFeedback                 │
 * └──────────────────────────────────────────────────────┴────────────────────────────────┘
 */

export {
  getAllFeedback,
  getFeedbackById,
  createFeedback,
  updateFeedbackStatus,
  deleteFeedback,
} from "./feedbackController";

export const FEEDBACK_ROUTES = {
  list:         "GET    /api/feedback",
  getById:      "GET    /api/feedback/:id",
  create:       "POST   /api/feedback",
  updateStatus: "PATCH  /api/feedback/:id/status",
  delete:       "DELETE /api/feedback/:id",
} as const;
