/**
 * Our Story Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * Base: /api/ui/our-story
 *
 * ┌─────────────────────────────────────────────────────┬────────────────────┐
 * │ Endpoint                                            │ Handler            │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ GET  /api/ui/our-story                              │ getOurStory        │
 * │      Returns the single story record.               │                    │
 * │      Auto-creates with defaults if none exists.     │                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ PUT  /api/ui/our-story                              │ updateOurStory     │
 * │      multipart/form-data OR JSON:                   │                    │
 * │        image (file)? | imageUrl?,                   │                    │
 * │        title?,                                      │                    │
 * │        paragraph1?,                                 │                    │
 * │        paragraph2?,                                 │                    │
 * │        paragraph3?                                  │                    │
 * └─────────────────────────────────────────────────────┴────────────────────┘
 *
 * Notes:
 * - Single-row table — only one record ever exists (upsert pattern)
 * - paragraph1 is required; paragraph2 and paragraph3 are optional
 * - Image validation: JPEG, PNG, WebP, AVIF; max 5 MB
 * - imageUrl null = frontend falls back to static image
 */

export const OUR_STORY_ROUTES = {
  get:    "GET /api/ui/our-story",
  update: "PUT /api/ui/our-story",
} as const;

export { getOurStory, updateOurStory } from "./ourStoryController";
