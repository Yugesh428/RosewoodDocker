export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import {
  updateCategory,
  deleteCategory,
} from "@/features/Ui/ourProductCollection/productCollectionCategroryController";

// PUT    /api/ui/collection/categories/:id — update category
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return updateCategory(req, id);
}

// DELETE /api/ui/collection/categories/:id — delete + cascade items + image cleanup
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return deleteCategory(req, id);
}
