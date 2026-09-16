export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getAllProducts, createProduct } from "@/features/products/routes";

// GET  /api/products   → list all (?isActive, ?categoryId, ?search, ?page, ?limit)
export async function GET(req: NextRequest) {
  return getAllProducts(req);
}

// POST /api/products   → create single product
export async function POST(req: NextRequest) {
  return createProduct(req);
}
