import { NextRequest } from "next/server";
import { addToGuestCart } from "@/features/guestCart/guestCartController";

/**
 * POST /api/guest-cart
 * Add item to guest cart
 */
export async function POST(req: NextRequest) {
  return addToGuestCart(req);
}
