export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getWishlistByCustomer, addToWishlist } from "@/features/wishlist/routes";

// GET /api/wishlist?customerId=:id  → all wishlist items for a customer
export async function GET(req: NextRequest) {
  return getWishlistByCustomer(req);
}

// POST /api/wishlist  → add product to wishlist
export async function POST(req: NextRequest) {
  return addToWishlist(req);
}
