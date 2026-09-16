import { NextRequest } from "next/server";
import { clearGuestCart } from "@/features/guestCart/guestCartController";

/**
 * DELETE /api/guest-cart/session/:sessionId/clear
 * Clear all cart items for a guest session
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  return clearGuestCart(req, sessionId);
}
