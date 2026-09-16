import { NextRequest } from "next/server";
import { getGuestCart } from "@/features/guestCart/guestCartController";

/**
 * GET /api/guest-cart/session/:sessionId
 * Get all cart items for a guest session
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  return getGuestCart(req, sessionId);
}
