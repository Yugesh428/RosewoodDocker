export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import {
  getIngredientsByProduct,
  addIngredient,
  replaceIngredients,
} from "@/features/products/routes";

// GET /api/products/:id/ingredients  → all ingredients sorted by sortOrder
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getIngredientsByProduct(req, id);
}

// POST /api/products/:id/ingredients  → add single ingredient
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return addIngredient(req, id);
}

// PUT /api/products/:id/ingredients  → replace ALL ingredients
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return replaceIngredients(req, id);
}
