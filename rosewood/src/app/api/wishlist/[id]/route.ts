export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { removeFromWishlist } from "@/features/wishlist/routes";

// DELETE /api/wishlist/:id  → remove item from wishlist
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return removeFromWishlist(req, id);
}
