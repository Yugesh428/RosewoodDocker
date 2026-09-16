import { NextRequest } from "next/server";
import { cancelGuestOrder } from "@/features/orders/guestOrderController";

/**
 * PATCH /api/orders/guest/:orderId/cancel
 * Cancel guest order with email verification
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  return cancelGuestOrder(req, orderId);
}
