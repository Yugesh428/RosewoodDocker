export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { bulkCreateProducts } from "@/features/products/routes";

/**
 * POST /api/products/bulk
 *
 * Option 1 — JSON array:
 *   Content-Type: application/json
 *   Body: [{ categoryId, productName, dosageForm, strength, packSize, unitType,
 *            sellingPrice, originalPrice, tax?, discount?, productDescription?,
 *            imageUrl?, isActive? }, ...]
 *
 * Option 2 — Excel upload:
 *   Content-Type: multipart/form-data
 *   Field name: file  (.xlsx / .xls)
 *   See feature/products/routes.ts for full column reference
 */
export async function POST(req: NextRequest) {
  return bulkCreateProducts(req);
}
