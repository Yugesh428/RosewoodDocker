export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { clearWishlist } from "@/features/wishlist/routes";

// DELETE /api/wishlist/customer/:customerId  → clear entire wishlist
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params;
  return clearWishlist(req, customerId);
}
