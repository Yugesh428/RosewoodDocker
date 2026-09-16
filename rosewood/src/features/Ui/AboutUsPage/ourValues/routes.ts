/**
 * Our Values Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * Base: /api/ui/values
 *
 * ┌─────────────────────────────────────────────────────┬────────────────────┐
 * │ Endpoint                                            │ Handler            │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ GET    /api/ui/values                               │ getValues          │
 * │        ?all=true  (optional: include inactive)      │                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ GET    /api/ui/values/:id                           │ getValue           │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ POST   /api/ui/values                               │ createValue        │
 * │        multipart/form-data OR JSON:                 │                    │
 * │          image (SVG/PNG/JPG/WebP/AVIF, max 2 MB)   │                    │
 * │          OR imageUrl?,                              │                    │
 * │          title (required),                          │                    │
 * │          description (required),                    │                    │
 * │          displayOrder?, isActive?                   │                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ PUT    /api/ui/values/:id                           │ updateValue        │
 * │        Same fields as POST (all optional)           │                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ PATCH  /api/ui/values/:id/toggle                    │ toggleValue        │
 * │        Flips isActive: true↔false                   │                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ PATCH  /api/ui/values/reorder                       │ reorderValues      │
 * │        Body: [{ id, displayOrder }, ...]            │                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ DELETE /api/ui/values/:id                           │ deleteValue        │
 * │        Deletes value + icon from storage            │                    │
 * └─────────────────────────────────────────────────────┴────────────────────┘
 *
 * Notes:
 * - imageUrl stores the uploaded icon path (SVG recommended for icons)
 * - Allowed icon types: SVG, JPEG, PNG, WebP, AVIF — max 2 MB
 * - UI renders 4 value cards: Trust, Quality, Care, Reliability
 * - displayOrder controls card ordering in the grid
 */

export const VALUES_ROUTES = {
  list:    "GET    /api/ui/values",
  getById: "GET    /api/ui/values/:id",
  create:  "POST   /api/ui/values",
  update:  "PUT    /api/ui/values/:id",
  toggle:  "PATCH  /api/ui/values/:id/toggle",
  reorder: "PATCH  /api/ui/values/reorder",
  delete:  "DELETE /api/ui/values/:id",
} as const;

export {
  getValues,
  getValue,
  createValue,
  updateValue,
  toggleValue,
  reorderValues,
  deleteValue,
} from "./ourValuesController";
