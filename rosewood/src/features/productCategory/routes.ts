/**
 * Product Category Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * Base: /api/product-categories
 *
 * ┌─────────────────────────────────────────────────────┬────────────────────┐
 * │ Endpoint                                            │ Handler            │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ GET    /api/product-categories                      │ getAllCategories    │
 * │        ?isActive=true|false  (optional filter)      │                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ POST   /api/product-categories                      │ createCategory     │
 * │        Body: { categoryName, categoryDescription?,  │                    │
 * │               isActive? }                           │                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ GET    /api/product-categories/:id                  │ getCategoryById    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ PUT    /api/product-categories/:id                  │ updateCategory     │
 * │        Body: { categoryName?, categoryDescription?, │                    │
 * │               isActive? }                           │                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ PATCH  /api/product-categories/:id/toggle-active    │ toggleCategoryActive│
 * │        Flips isActive: true↔false                   │                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ POST   /api/product-categories/bulk                 │ bulkCreateCategories│
 * │        JSON: Array of category objects              │                    │
 * │        OR multipart/form-data with field "file"     │                    │
 * │        (.xlsx/.xls) — columns:                      │                    │
 * │          categoryName | Category Name | name        │                    │
 * │          categoryDescription | Description (opt)    │                    │
 * │          isActive (opt, default: true)              │                    │
 * └─────────────────────────────────────────────────────┴────────────────────┘
 *
 * Notes:
 * - DELETE is intentionally not exposed (soft delete via isActive toggle)
 * - Bulk skips duplicates by categoryName (case-insensitive) and reports them
 * - All routes run in Node.js runtime (not Edge) due to Sequelize / xlsx
 */

export const PRODUCT_CATEGORY_ROUTES = {
  list:         "GET    /api/product-categories",
  create:       "POST   /api/product-categories",
  getById:      "GET    /api/product-categories/:id",
  update:       "PUT    /api/product-categories/:id",
  toggleActive: "PATCH  /api/product-categories/:id/toggle-active",
  bulk:         "POST   /api/product-categories/bulk",
} as const;

export {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  toggleCategoryActive,
  bulkCreateCategories,
} from "./productCategoryController";
