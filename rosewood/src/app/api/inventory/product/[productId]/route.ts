export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getInventoryByProduct } from "@/features/inventory/routes";

// GET /api/inventory/product/:productId  → all batches for a product + total stock summary
export async function GET(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  return getInventoryByProduct(req, productId);
}
