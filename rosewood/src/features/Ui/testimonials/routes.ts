/**
 * Testimonials Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * Base: /api/ui/testimonials
 *
 * ┌─────────────────────────────────────────────────────┬──────────────────────┐
 * │ Endpoint                                            │ Handler              │
 * ├─────────────────────────────────────────────────────┼──────────────────────┤
 * │ GET    /api/ui/testimonials                         │ getTestimonials      │
 * │        ?all=true  (optional: include inactive)      │                      │
 * ├─────────────────────────────────────────────────────┼──────────────────────┤
 * │ GET    /api/ui/testimonials/:id                     │ getTestimonial       │
 * ├─────────────────────────────────────────────────────┼──────────────────────┤
 * │ POST   /api/ui/testimonials                         │ createTestimonial    │
 * │        multipart/form-data OR JSON:                 │                      │
 * │          photo (file) | photoUrl (required),        │                      │
 * │          rating (1–5, required),                    │                      │
 * │          quote (required),                          │                      │
 * │          authorName (required),                     │                      │
 * │          authorTitle?, displayOrder?, isActive?     │                      │
 * ├─────────────────────────────────────────────────────┼──────────────────────┤
 * │ PUT    /api/ui/testimonials/:id                     │ updateTestimonial    │
 * │        Same fields as POST (all optional)           │                      │
 * ├─────────────────────────────────────────────────────┼──────────────────────┤
 * │ PATCH  /api/ui/testimonials/:id/toggle              │ toggleTestimonial    │
 * │        Flips isActive: true↔false                   │                      │
 * ├─────────────────────────────────────────────────────┼──────────────────────┤
 * │ PATCH  /api/ui/testimonials/reorder                 │ reorderTestimonials  │
 * │        Body: [{ id, displayOrder }, ...]            │                      │
 * ├─────────────────────────────────────────────────────┼──────────────────────┤
 * │ DELETE /api/ui/testimonials/:id                     │ deleteTestimonial    │
 * │        Deletes testimonial + photo from storage     │                      │
 * └─────────────────────────────────────────────────────┴──────────────────────┘
 *
 * Notes:
 * - Public access: GET without ?all=true returns active testimonials only
 * - Admin access: all other endpoints + GET with ?all=true
 * - Photo validation: JPEG, PNG, WebP, AVIF; max 5 MB
 * - rating must be integer 1–5
 * - All routes run in Node.js runtime due to file handling
 */

export const TESTIMONIAL_ROUTES = {
  list:    "GET    /api/ui/testimonials",
  getById: "GET    /api/ui/testimonials/:id",
  create:  "POST   /api/ui/testimonials",
  update:  "PUT    /api/ui/testimonials/:id",
  toggle:  "PATCH  /api/ui/testimonials/:id/toggle",
  reorder: "PATCH  /api/ui/testimonials/reorder",
  delete:  "DELETE /api/ui/testimonials/:id",
} as const;

export {
  getTestimonials,
  getTestimonial,
  createTestimonial,
  updateTestimonial,
  toggleTestimonial,
  reorderTestimonials,
  deleteTestimonial,
} from "./testimonialsController";
