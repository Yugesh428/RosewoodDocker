import { NextRequest } from "next/server";
import { getOrdersByCustomer } from "@/features/orders/orderController";

/**
 * GET /api/orders/customer/:customerId
 * Fetch all orders for a specific customer
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ customerId: string }> }
) {
  const params = await context.params;
  return getOrdersByCustomer(req, params.customerId);
}
