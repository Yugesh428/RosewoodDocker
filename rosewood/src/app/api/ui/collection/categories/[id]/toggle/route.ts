export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { toggleCategory } from "@/features/Ui/ourProductCollection/productCollectionCategroryController";

// PATCH /api/ui/collection/categories/:id/toggle — flip isActive
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return toggleCategory(req, id);
}
