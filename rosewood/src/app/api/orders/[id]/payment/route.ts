export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { updatePaymentStatus } from "@/features/orders/routes";

// PATCH /api/orders/:id/payment  → update payment status (unpaid → paid → refunded)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updatePaymentStatus(req, id);
}
