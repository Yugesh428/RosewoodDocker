/**
 * Our Product Collection — Category Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * Base: /api/ui/collection/categories
 *
 * ┌─────────────────────────────────────────────────────┬────────────────────┐
 * │ Endpoint                                            │ Handler            │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ GET    /api/ui/collection/categories                │ getCategories      │
 * │        ?all=true  (optional: include inactive)      │                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ POST   /api/ui/collection/categories                │ createCategory     │
 * │        Body: { name, slug, description?,            │                    │
 * │               displayOrder?, isActive? }            │                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ PUT    /api/ui/collection/categories/:id            │ updateCategory     │
 * │        Body: { name?, slug?, description?,          │                    │
 * │               displayOrder?, isActive? }            │                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ PATCH  /api/ui/collection/categories/:id/toggle     │ toggleCategory     │
 * │        Flips isActive: true↔false                   │                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ DELETE /api/ui/collection/categories/:id            │ deleteCategory     │
 * │        Cascades: deletes all items + their images   │                    │
 * └─────────────────────────────────────────────────────┴────────────────────┘
 *
 * Notes:
 * - Categories are the tab labels (e.g. "Skincare", "Wellness")
 * - No image on category — images live on the product items
 * - DELETE cascades to all child products automatically
 */

export const COLLECTION_CATEGORY_ROUTES = {
  list:   "GET    /api/ui/collection/categories",
  create: "POST   /api/ui/collection/categories",
  update: "PUT    /api/ui/collection/categories/:id",
  toggle: "PATCH  /api/ui/collection/categories/:id/toggle",
  delete: "DELETE /api/ui/collection/categories/:id",
} as const;

export {
  getCategories,
  createCategory,
  updateCategory,
  toggleCategory,
  deleteCategory,
} from "./productCollectionCategroryController";
