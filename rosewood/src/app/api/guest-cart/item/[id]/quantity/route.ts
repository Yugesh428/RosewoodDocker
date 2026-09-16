import { NextRequest } from "next/server";
import { updateGuestCartQuantity } from "@/features/guestCart/guestCartController";

/**
 * PATCH /api/guest-cart/item/:id/quantity
 * Update cart item quantity
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return updateGuestCartQuantity(req, id);
}
