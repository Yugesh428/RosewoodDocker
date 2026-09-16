/**
 * Staff Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * Base: /api/staff
 *
 * Staff is a pure record — no login, no auth.
 * Managed by admins only.
 *
 * ┌──────────────────────────────────────────────────────┬────────────────────────────────┐
 * │ Endpoint                                             │ Handler                        │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ GET    /api/staff                                    │ getAllStaff                     │
 * │        ?isActive, ?role, ?search, ?page, ?limit      │                                │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ POST   /api/staff                                    │ createStaff                    │
 * │        { fullName, employeeCode, role, phone,        │                                │
 * │          dateOfJoining, salary?, email?,             │                                │
 * │          address?, isActive?, notes? }               │                                │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ POST   /api/staff/bulk                               │ bulkCreateStaff                │
 * │        JSON array  OR  multipart (.xlsx / .xls)      │ Skips duplicate employeeCodes  │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ GET    /api/staff/:id                                │ getStaffById                   │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ PUT    /api/staff/:id                                │ updateStaff                    │
 * ├──────────────────────────────────────────────────────┼────────────────────────────────┤
 * │ PATCH  /api/staff/:id/toggle-active                  │ toggleStaffActive              │
 * └──────────────────────────────────────────────────────┴────────────────────────────────┘
 *
 * Roles: pharmacist | cashier | store_manager | delivery | inventory_clerk | other
 *
 * Excel columns (any casing accepted):
 *   fullName / Full Name / Name
 *   employeeCode / Employee Code / Code
 *   role / Role
 *   phone / Phone
 *   email / Email
 *   address / Address
 *   dateOfJoining / Date of Joining / Joining Date
 *   salary / Salary
 *   isActive / Active  (default true)
 *   notes / Notes
 */

export {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  toggleStaffActive,
  bulkCreateStaff,
} from "./staffController";

export const STAFF_ROUTES = {
  list:         "GET    /api/staff",
  create:       "POST   /api/staff",
  bulk:         "POST   /api/staff/bulk",
  getById:      "GET    /api/staff/:id",
  update:       "PUT    /api/staff/:id",
  delete:       "DELETE /api/staff/:id",
  toggleActive: "PATCH  /api/staff/:id/toggle-active",
} as const;
