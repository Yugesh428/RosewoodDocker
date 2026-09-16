/**
 * Customer Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * Base: /api/customers
 *
 * Rules:
 *   - No create endpoint — customers self-register via /api/customer/register.
 *   - Password is NEVER returned in any response (SAFE_ATTRIBUTES filter).
 *   - Admin can view, update (name/email), activate/deactivate accounts.
 *   - Deactivated accounts should be blocked at the auth layer (NextAuth).
 *
 * ┌──────────────────────────────────────────────────────┬────────────────────────────────┐
 * │ Endpoint                                             │ Handler                        │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ GET    /api/customers                                │ getAllCustomers                 │
 * │        ?isActive, ?search (name/email), ?page, ?limit│                                │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ GET    /api/customers/stats                          │ getCustomerStats               │
 * │        total / active / inactive counts              │                                │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ GET    /api/customers/:id                            │ getCustomerById                │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ GET    /api/customers/:id/orders                     │ getCustomerWithOrders          │
 * │        ?page, ?limit                                 │ Profile + order history + stats│
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ PUT    /api/customers/:id                            │ updateCustomer                 │
 * │        { name?, email? }                             │ Name / email only              │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ PATCH  /api/customers/:id/toggle-active              │ toggleCustomerActive           │
 * │                                                      │ Activate / deactivate account  │
 * └──────────────────────────────────────────────────────┴────────────────────────────────┘
 */

export {
  getAllCustomers,
  getCustomerById,
  getCustomerWithOrders,
  updateCustomer,
  toggleCustomerActive,
  getCustomerStats,
} from "./customerController";

export const CUSTOMER_ROUTES = {
  list:         "GET    /api/customers",
  stats:        "GET    /api/customers/stats",
  getById:      "GET    /api/customers/:id",
  orders:       "GET    /api/customers/:id/orders",
  update:       "PUT    /api/customers/:id",
  toggleActive: "PATCH  /api/customers/:id/toggle-active",
} as const;
