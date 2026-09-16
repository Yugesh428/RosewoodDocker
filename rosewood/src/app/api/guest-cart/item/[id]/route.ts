import { NextRequest } from "next/server";
import { removeFromGuestCart } from "@/features/guestCart/guestCartController";

/**
 * DELETE /api/guest-cart/item/:id
 * Remove a single item from guest cart
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return removeFromGuestCart(req, id);
}
