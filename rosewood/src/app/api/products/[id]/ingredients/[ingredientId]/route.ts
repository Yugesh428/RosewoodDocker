export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { updateIngredient, deleteIngredient } from "@/features/products/routes";

// PUT    /api/products/:id/ingredients/:ingredientId  → update single ingredient
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; ingredientId: string }> },
) {
  const { id, ingredientId } = await params;
  return updateIngredient(req, id, ingredientId);
}

// DELETE /api/products/:id/ingredients/:ingredientId  → remove single ingredient
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; ingredientId: string }> },
) {
  const { id, ingredientId } = await params;
  return deleteIngredient(req, id, ingredientId);
}
