export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import {
  getProduct,
  updateProduct,
  deleteProduct,
} from "@/features/Ui/ourProductCollection/ourProductContent/ourProductController";

// GET    /api/ui/collection/products/:id — get single product card
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return getProduct(req, id);
}

// PUT    /api/ui/collection/products/:id — update product card (multipart or JSON)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return updateProduct(req, id);
}

// DELETE /api/ui/collection/products/:id — delete product + all images
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return deleteProduct(req, id);
}
