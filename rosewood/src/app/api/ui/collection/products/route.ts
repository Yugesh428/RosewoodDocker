export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import {
  getProducts,
  createProduct,
} from "@/features/Ui/ourProductCollection/ourProductContent/ourProductController";

// GET  /api/ui/collection/products          — public (active) | admin (?all=true)
// Optional: ?categoryId=<uuid> to filter by category
export async function GET(req: NextRequest) {
  return getProducts(req);
}

// POST /api/ui/collection/products          — admin: create product card (multipart/form-data or JSON)
export async function POST(req: NextRequest) {
  return createProduct(req);
}
