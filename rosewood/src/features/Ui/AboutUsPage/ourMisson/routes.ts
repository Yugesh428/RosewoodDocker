/**
 * Our Mission Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * Base: /api/ui/mission
 *
 * ┌─────────────────────────────────────────────────────┬────────────────────┐
 * │ Endpoint                                            │ Handler            │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ GET  /api/ui/mission                                │ getMission         │
 * │      Returns the single mission record.             │                    │
 * │      Auto-creates with defaults if none exists.     │                    │
 * ├─────────────────────────────────────────────────────┼────────────────────┤
 * │ PUT  /api/ui/mission                                │ updateMission      │
 * │      Body: { subtitle?, description? }              │                    │
 * └─────────────────────────────────────────────────────┴────────────────────┘
 *
 * UI mapping:
 *   subtitle    → section heading  e.g. "A Higher Standard of Care"
 *   description → the quote text   e.g. "To provide an unparalleled..."
 *
 * Notes:
 * - Single-row table — only one record ever exists (upsert pattern)
 * - No image needed — mission section is text only
 */

export const MISSION_ROUTES = {
  get:    "GET /api/ui/mission",
  update: "PUT /api/ui/mission",
} as const;

export { getMission, updateMission } from "./missionController";
