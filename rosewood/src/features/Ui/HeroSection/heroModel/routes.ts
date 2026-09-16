/**
 * Hero Section Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * Base: /api/ui/hero
 *
 * ┌─────────────────────────────────────────────────────┬────────────────────┐
 * │ Endpoint                                            │ Handler            │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ GET    /api/ui/hero                                 │ getHeroSlides      │
 * │        ?all=true  (optional: include inactive)      │                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ POST   /api/ui/hero                                 │ createHeroSlide    │
 * │        multipart/form-data:                         │                    │
 * │          image (file), title?, subtitle?,           │                    │
 * │          order?, isActive?                          │                    │
 * │        OR JSON: { imageUrl, title?, subtitle?, ... }│                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ PUT    /api/ui/hero/:id                             │ updateHeroSlide    │
 * │        multipart/form-data or JSON                  │                    │
 * │        Fields: image?, title?, subtitle?,           │                    │
 * │                order?, isActive?                    │                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ PATCH  /api/ui/hero/:id/toggle                      │ toggleHeroSlide    │
 * │        Flips isActive: true↔false                   │                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ PATCH  /api/ui/hero/reorder                         │ reorderHeroSlides  │
 * │        Body: [{ id, order }, ...]                   │                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ DELETE /api/ui/hero/:id                             │ deleteHeroSlide    │
 * │        Deletes slide and its image                  │                    │
 * └─────────────────────────────────────────────────────┴────────────────────┘
 *
 * Notes:
 * - Public access: GET without ?all=true returns only active slides
 * - Admin access: all other endpoints + GET with ?all=true
 * - Maximum 5 hero slides allowed
 * - Image validation: JPEG, PNG, WebP, AVIF; max 5MB
 * - CTA buttons are hardcoded by developers (not client-editable)
 * - All routes run in Node.js runtime due to file handling
 */

export const HERO_ROUTES = {
  list:     "GET    /api/ui/hero",
  create:   "POST   /api/ui/hero",
  update:   "PUT    /api/ui/hero/:id",
  toggle:   "PATCH  /api/ui/hero/:id/toggle",
  reorder:  "PATCH  /api/ui/hero/reorder",
  delete:   "DELETE /api/ui/hero/:id",
} as const;

export {
  getHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  toggleHeroSlide,
  reorderHeroSlides,
  deleteHeroSlide,
} from "./heroController";
