import { NextRequest } from "next/server";
import { trackGuestOrder } from "@/features/orders/guestOrderController";

/**
 * POST /api/orders/guest/track
 * Track guest order by orderId + email
 */
export async function POST(req: NextRequest) {
  return trackGuestOrder(req);
}
