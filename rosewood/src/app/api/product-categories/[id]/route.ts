export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getCategoryById, updateCategory } from "@/features/productCategory/routes";

// GET /api/product-categories/:id   → single category with subCategories + parentCategory
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getCategoryById(req, id);
}

// PUT /api/product-categories/:id   → update category
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateCategory(req, id);
}
