/**
 * Our Product Collection — Product (Item) Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * Base: /api/ui/collection/products
 *
 * ┌─────────────────────────────────────────────────────┬────────────────────┐
 * │ Endpoint                                            │ Handler            │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ GET    /api/ui/collection/products                  │ getProducts        │
 * │        ?all=true        (include inactive)          │                    │
 * │        ?categoryId=<id> (filter by category tab)   │                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ GET    /api/ui/collection/products/:id              │ getProduct         │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ POST   /api/ui/collection/products                  │ createProduct      │
 * │        multipart/form-data OR JSON:                 │                    │
 * │          title (required), categoryId (required),   │                    │
 * │          subtitle?,                                 │                    │
 * │          backgroundImage (file)? | backgroundImageUrl?, │               │
 * │          videoUrl?,                                 │                    │
 * │          photo1 (file)? | photo1Url?,               │                    │
 * │          photo1Title?, photo1Subtitle?,             │                    │
 * │          photo2 (file)? | photo2Url?,               │                    │
 * │          photo2Title?, photo2Subtitle?,             │                    │
 * │          isActive?                                  │                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ PUT    /api/ui/collection/products/:id              │ updateProduct      │
 * │        Same fields as POST (all optional)           │                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ PATCH  /api/ui/collection/products/:id/toggle       │ toggleProduct      │
 * │        Flips isActive: true↔false                   │                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ DELETE /api/ui/collection/products/:id              │ deleteProduct      │
 * │        Deletes product + all its images from storage│                    │
 * └─────────────────────────────────────────────────────┴────────────────────┘
 *
 * Notes:
 * - Public access: GET without ?all=true returns active products only
 * - Admin access: all other endpoints + GET with ?all=true
 * - Image validation: JPEG, PNG, WebP, AVIF; max 5 MB per file
 * - Each product can have: backgroundImage, photo1, photo2 (all optional)
 * - Deleting a category cascades and removes all its products automatically
 * - All routes run in Node.js runtime due to file handling
 */

export const COLLECTION_PRODUCT_ROUTES = {
  list:    "GET    /api/ui/collection/products",
  getById: "GET    /api/ui/collection/products/:id",
  create:  "POST   /api/ui/collection/products",
  update:  "PUT    /api/ui/collection/products/:id",
  toggle:  "PATCH  /api/ui/collection/products/:id/toggle",
  delete:  "DELETE /api/ui/collection/products/:id",
} as const;

export {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  toggleProduct,
  deleteProduct,
} from "./ourProductController";
