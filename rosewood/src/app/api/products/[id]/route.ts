export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getProductById, updateProduct } from "@/features/products/routes";

// GET /api/products/:id   → single product with category join
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getProductById(req, id);
}

// PUT /api/products/:id   → update product
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateProduct(req, id);
}
