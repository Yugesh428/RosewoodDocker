export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { deductStockOnDelivery } from "@/features/inventory/routes";

/**
 * POST /api/inventory/deduct
 * Called by order service when delivery is confirmed.
 * Auto-selects batch using FEFO if inventoryId is not provided.
 *
 * Body: { productId, quantity, inventoryId?, orderId? }
 */
export async function POST(req: NextRequest) {
  return deductStockOnDelivery(req);
}
