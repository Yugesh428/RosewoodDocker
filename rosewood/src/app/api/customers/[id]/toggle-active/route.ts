export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { toggleCustomerActive } from "@/features/customers/routes";

// PATCH /api/customers/:id/toggle-active  → activate / deactivate customer account
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return toggleCustomerActive(req, id);
}
