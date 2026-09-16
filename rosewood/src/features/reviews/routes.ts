/**
 * Review Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * Base: /api/reviews
 *
 * Rules:
 *   - One customer can only review each product once (unique constraint).
 *   - isVerifiedPurchase = true if customer has a delivered order with this product.
 *   - All reviews need admin approval (isApproved) before showing publicly.
 *
 * ┌──────────────────────────────────────────────────────┬────────────────────────────────┐
 * │ Endpoint                                             │ Handler                        │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ GET    /api/reviews?productId=:id                    │ getReviewsByProduct             │
 * │        ?isApproved, ?page, ?limit                    │ Includes avg rating + stats    │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ GET    /api/reviews/customer/:customerId             │ getReviewsByCustomer           │
 * │        ?page, ?limit                                 │                                │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ POST   /api/reviews                                  │ createReview                   │
 * │        { customerId, productId, rating, reviewText? }│ Auto-checks verified purchase  │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ PUT    /api/reviews/:id                              │ updateReview                   │
 * │        { rating?, reviewText? }                      │ Customer updates own review    │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ PATCH  /api/reviews/:id/approve                      │ approveReview                  │
 * │        Admin approves review                         │                                │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ DELETE /api/reviews/:id                              │ deleteReview                   │
 * └──────────────────────────────────────────────────────┴────────────────────────────────┘
 */

export {
  getReviewsByProduct,
  getReviewsByCustomer,
  createReview,
  updateReview,
  approveReview,
  deleteReview,
} from "./reviewController";

export const REVIEW_ROUTES = {
  listByProduct:   "GET    /api/reviews?productId=:id",
  listByCustomer:  "GET    /api/reviews/customer/:customerId",
  create:          "POST   /api/reviews",
  update:          "PUT    /api/reviews/:id",
  approve:         "PATCH  /api/reviews/:id/approve",
  delete:          "DELETE /api/reviews/:id",
} as const;
