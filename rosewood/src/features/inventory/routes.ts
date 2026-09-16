/**
 * Inventory Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * Base: /api/inventory
 *
 * Business rules:
 *   - No stock reservation. Payment confirmed before order accepted.
 *   - Delivery deducts stock  → POST /api/inventory/deduct
 *   - Cancellation restores   → POST /api/inventory/restore
 *   - Manual adjustments      → POST /api/inventory/:id/adjust-stock
 *   - Auto batch selection uses FEFO (First Expiry, First Out).
 *
 * ┌──────────────────────────────────────────────────────┬────────────────────────────────┐
 * │ Endpoint                                             │ Handler                        │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ GET    /api/inventory                                │ getAllInventory                 │
 * │        ?productId, ?status, ?isActive, ?search       │                                │
 * │        ?page, ?limit                                 │                                │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ POST   /api/inventory                                │ createInventory                │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ GET    /api/inventory/:id                            │ getInventoryById               │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ PUT    /api/inventory/:id                            │ updateInventory                │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ PATCH  /api/inventory/:id/toggle-active              │ toggleInventoryActive          │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ POST   /api/inventory/:id/adjust-stock               │ adjustStock                    │
 * │        { type:"add"|"subtract", amount, reason? }    │ Manual restock / write-off     │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ GET    /api/inventory/product/:productId             │ getInventoryByProduct          │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ POST   /api/inventory/deduct                         │ deductStockOnDelivery          │
 * │        { productId, quantity, inventoryId?, orderId? }│                               │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ POST   /api/inventory/restore                        │ restoreStockOnCancellation     │
 * │        { inventoryId, quantity, orderId? }           │                               │
 * └──────────────────────────────────────────────────────┴────────────────────────────────┘
 */

export {
  getAllInventory,
  getInventoryById,
  getInventoryByProduct,
  createInventory,
  updateInventory,
  deductStockOnDelivery,
  restoreStockOnCancellation,
  toggleInventoryActive,
} from "./inventoryController";

export const INVENTORY_ROUTES = {
  list:           "GET    /api/inventory",
  create:         "POST   /api/inventory",
  getById:        "GET    /api/inventory/:id",
  update:         "PUT    /api/inventory/:id",
  toggleActive:   "PATCH  /api/inventory/:id/toggle-active",
  byProduct:      "GET    /api/inventory/product/:productId",
  deductDelivery: "POST   /api/inventory/deduct",
  restoreCancel:  "POST   /api/inventory/restore",
} as const;
