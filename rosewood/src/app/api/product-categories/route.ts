export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getAllCategories, createCategory } from "@/features/productCategory/routes";

// GET  /api/product-categories   → list all (?isActive, ?parentId, ?search, ?page, ?limit)
export async function GET(req: NextRequest) {
  return getAllCategories(req);
}

// POST /api/product-categories   → create single category
export async function POST(req: NextRequest) {
  return createCategory(req);
}
