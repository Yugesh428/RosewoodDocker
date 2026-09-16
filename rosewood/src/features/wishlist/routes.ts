/**
 * Wishlist Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * Base: /api/wishlist
 *
 * Rules:
 *   - One customer can only add each product once (unique constraint).
 *   - Deleting a product or customer cascades to wishlist.
 *
 * ┌──────────────────────────────────────────────────────┬────────────────────────────────┐
 * │ Endpoint                                             │ Handler                        │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ GET    /api/wishlist?customerId=:id                  │ getWishlistByCustomer           │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ POST   /api/wishlist                                 │ addToWishlist                  │
 * │        { customerId, productId }                     │                                │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ DELETE /api/wishlist/:id                             │ removeFromWishlist             │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ DELETE /api/wishlist/customer/:customerId            │ clearWishlist                  │
 * │        Clear entire wishlist                         │                                │
 * └──────────────────────────────────────────────────────┴────────────────────────────────┘
 */

export {
  getWishlistByCustomer,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} from "./wishlistController";

export const WISHLIST_ROUTES = {
  listByCustomer: "GET    /api/wishlist?customerId=:id",
  add:            "POST   /api/wishlist",
  remove:         "DELETE /api/wishlist/:id",
  clear:          "DELETE /api/wishlist/customer/:customerId",
} as const;
