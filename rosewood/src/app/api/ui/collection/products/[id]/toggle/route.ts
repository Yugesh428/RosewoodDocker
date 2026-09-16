export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { toggleProduct } from "@/features/Ui/ourProductCollection/ourProductContent/ourProductController";

// PATCH /api/ui/collection/products/:id/toggle — flip isActive
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return toggleProduct(req, id);
}
