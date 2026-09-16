export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getCustomerById, updateCustomer } from "@/features/customers/routes";

// GET /api/customers/:id  → single customer (no password)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getCustomerById(req, id);
}

// PUT /api/customers/:id  → update name / email
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateCustomer(req, id);
}
