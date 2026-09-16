/**
 * Guest Cart Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * Base: /api/guest-cart
 *
 * For non-logged-in customers to manage their shopping cart.
 * Uses sessionId (client-generated UUID stored in cookie/localStorage).
 * Cart items auto-expire after 7 days of inactivity.
 *
 * ┌────────────────────────────────────────────────────────────────────┬────────────────────────────────┐
 * │ Endpoint                                                           │ Handler                        │
 * ├────────────────────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ GET    /api/guest-cart/session/:sessionId                          │ getGuestCart                   │
 * │        Get all cart items for session                              │                                │
 * ├────────────────────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ POST   /api/guest-cart                                             │ addToGuestCart                 │
 * │        { sessionId, productId, inventoryId, quantity }             │ Add/update cart item           │
 * ├────────────────────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ PATCH  /api/guest-cart/item/:id/quantity                           │ updateGuestCartQuantity        │
 * │        { quantity }                                                │ Update item quantity           │
 * ├────────────────────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ DELETE /api/guest-cart/item/:id                                    │ removeFromGuestCart            │
 * │        Remove single item by cart item ID                          │                                │
 * ├────────────────────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ DELETE /api/guest-cart/session/:sessionId/clear                    │ clearGuestCart                 │
 * │        Clear all cart items for session                            │                                │
 * ├────────────────────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ POST   /api/guest-cart/cleanup                                     │ cleanupExpiredCarts            │
 * │        Admin/Cron: Delete expired carts                            │                                │
 * └────────────────────────────────────────────────────────────────────┴────────────────────────────────┘
 */

export {
  getGuestCart,
  addToGuestCart,
  updateGuestCartQuantity,
  removeFromGuestCart,
  clearGuestCart,
  cleanupExpiredCarts,
} from "./guestCartController";

export const GUEST_CART_ROUTES = {
  getCart:        "GET    /api/guest-cart/session/:sessionId",
  addItem:        "POST   /api/guest-cart",
  updateQuantity: "PATCH  /api/guest-cart/item/:id/quantity",
  removeItem:     "DELETE /api/guest-cart/item/:id",
  clearCart:      "DELETE /api/guest-cart/session/:sessionId/clear",
  cleanup:        "POST   /api/guest-cart/cleanup",
} as const;
