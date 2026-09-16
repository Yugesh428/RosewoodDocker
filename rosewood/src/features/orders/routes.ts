/**
 * Order Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * Base: /api/orders
 *
 * Business rules:
 *   - Orders are placed AFTER payment is confirmed (no stock reservation).
 *   - Status: pending → confirmed → processing → shipped → delivered
 *             Any non-delivered state → cancelled
 *   - Delivery (→ delivered) deducts stock automatically from each batch.
 *   - Cancellation (→ cancelled) restores stock if order was confirmed or beyond.
 *   - Payment status is updated separately via PATCH /api/orders/:id/payment.
 *
 * ┌──────────────────────────────────────────────────────┬────────────────────────────────┐
 * │ Endpoint                                             │ Handler                        │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ GET    /api/orders                                   │ getAllOrders                   │
 * │        ?customerId, ?orderStatus, ?paymentStatus     │                                │
 * │        ?search (name/email), ?dateFrom, ?dateTo      │                                │
 * │        ?page, ?limit                                 │                                │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ POST   /api/orders                                   │ createOrder                    │
 * │        { customerId, paymentMethod, deliveryAddress, │                                │
 * │          deliveryNotes?, items: [{productId,         │                                │
 * │          inventoryId, quantity}] }                   │                                │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ GET    /api/orders/stats                             │ getOrderStats                  │
 * │        ?dateFrom, ?dateTo                            │                                │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ GET    /api/orders/:id                               │ getOrderById                   │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ PATCH  /api/orders/:id/status                        │ updateOrderStatus              │
 * │        { status, cancellationReason? }               │ Handles stock on deliver/cancel│
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ PATCH  /api/orders/:id/payment                       │ updatePaymentStatus            │
 * │        { paymentStatus: "paid"|"unpaid"|"refunded" } │                                │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ GET    /api/orders/customer/:customerId              │ getOrdersByCustomer            │
 * │        ?orderStatus, ?page, ?limit                   │                                │
 * └──────────────────────────────────────────────────────┴────────────────────────────────┘
 */

export {
  getAllOrders,
  getOrderById,
  getOrdersByCustomer,
  createOrder,
  updateOrderStatus,
  updatePaymentStatus,
  getOrderStats,
} from "./orderController";

export const ORDER_ROUTES = {
  list:           "GET    /api/orders",
  create:         "POST   /api/orders",
  stats:          "GET    /api/orders/stats",
  getById:        "GET    /api/orders/:id",
  updateStatus:   "PATCH  /api/orders/:id/status",
  updatePayment:  "PATCH  /api/orders/:id/payment",
  byCustomer:     "GET    /api/orders/customer/:customerId",
} as const;
