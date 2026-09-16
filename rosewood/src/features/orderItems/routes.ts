/**
 * Order Item Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * Base: /api/order-items
 *
 * Business rules:
 *   - Items can only be added, updated, or removed while order is "pending".
 *   - Prices (unitPrice, taxRate, discountRate) are locked at creation time.
 *   - Only quantity can be changed after an item is created.
 *   - Removing the last item is blocked — cancel the order instead.
 *   - All mutations sync the parent order totals (subtotal, tax, discount, total).
 *
 * ┌──────────────────────────────────────────────────────┬────────────────────────────────┐
 * │ Endpoint                                             │ Handler                        │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ GET    /api/order-items?orderId=:id                  │ getItemsByOrder                │
 * │        orderId is required as a query param          │                                │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ GET    /api/order-items/:id                          │ getOrderItemById               │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ POST   /api/order-items                              │ addOrderItem                   │
 * │        { orderId, productId, inventoryId, quantity } │ Order must be "pending"        │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ PATCH  /api/order-items/:id/quantity                 │ updateOrderItemQuantity        │
 * │        { quantity }                                  │ Order must be "pending"        │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ DELETE /api/order-items/:id                          │ removeOrderItem                │
 * │                                                      │ Order must be "pending"        │
 * │                                                      │ Blocked if last item remains   │
 * └──────────────────────────────────────────────────────┴────────────────────────────────┘
 */

export {
  getItemsByOrder,
  getOrderItemById,
  addOrderItem,
  updateOrderItemQuantity,
  removeOrderItem,
} from "./orderItemController";

export const ORDER_ITEM_ROUTES = {
  listByOrder:     "GET    /api/order-items?orderId=:id",
  getById:         "GET    /api/order-items/:id",
  add:             "POST   /api/order-items",
  updateQuantity:  "PATCH  /api/order-items/:id/quantity",
  remove:          "DELETE /api/order-items/:id",
} as const;
