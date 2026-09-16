import { NextRequest } from "next/server";
import { cleanupExpiredCarts } from "@/features/guestCart/guestCartController";

/**
 * POST /api/guest-cart/cleanup
 * Admin/Cron: Clean up expired cart items
 * Run this periodically to remove carts that expired 7 days ago
 */
export async function POST(req: NextRequest) {
  return cleanupExpiredCarts(req);
}
