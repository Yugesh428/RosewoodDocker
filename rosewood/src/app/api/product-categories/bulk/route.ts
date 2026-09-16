export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { bulkCreateCategories } from "@/features/productCategory/routes";

/**
 * POST /api/product-categories/bulk
 *
 * Option 1 — JSON array:
 *   Content-Type: application/json
 *   Body: [{ "categoryName": "Vitamins", "categoryDescription": "...", "isActive": true }, ...]
 *
 * Option 2 — Excel upload:
 *   Content-Type: multipart/form-data
 *   Field: file (.xlsx / .xls)
 *   Columns: categoryName | Category Name | name
 *            categoryDescription | Description  (optional)
 *            isActive                            (optional, default true)
 */
export async function POST(req: NextRequest) {
  return bulkCreateCategories(req);
}
