export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { restoreStockOnCancellation } from "@/features/inventory/routes";

/**
 * POST /api/inventory/restore
 * Called by order service when an order is cancelled.
 * Restores stock back to the original batch.
 *
 * Body: { inventoryId, quantity, orderId? }
 */
export async function POST(req: NextRequest) {
  return restoreStockOnCancellation(req);
}
