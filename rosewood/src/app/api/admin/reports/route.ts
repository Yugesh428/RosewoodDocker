export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import sequelize from "@/lib/database/sequelize";
import { QueryTypes } from "sequelize";

/**
 * GET /api/admin/reports
 * Query params:
 *   period = "7d" | "30d" | "90d" | "1y" | "custom"
 *   from   = ISO date string (for custom)
 *   to     = ISO date string (for custom)
 *
 * Returns:
 *   - summary: total revenue, orders, avg order value, refunds
 *   - dailyRevenue: [{date, revenue, orders}] for chart
 *   - topProducts: [{productName, totalQty, totalRevenue}]
 *   - topCategories: [{categoryName, totalRevenue, orderCount}]
 *   - ordersByStatus: [{status, count, value}]
 *   - ordersByPaymentMethod: [{method, count, value}]
 *   - revenueByMonth: last 12 months [{month, revenue, orders}]
 *   - customerStats: {new, returning, guest}
 *   - avgProcessingTime: hours from pending → delivered
 */

function getPeriodDates(period: string, from?: string, to?: string) {
  const now = new Date();
  const toDate = to ? new Date(to) : now;
  let fromDate: Date;

  switch (period) {
    case "7d":
      fromDate = new Date(now); fromDate.setDate(now.getDate() - 7); break;
    case "30d":
      fromDate = new Date(now); fromDate.setDate(now.getDate() - 30); break;
    case "90d":
      fromDate = new Date(now); fromDate.setDate(now.getDate() - 90); break;
    case "1y":
      fromDate = new Date(now); fromDate.setFullYear(now.getFullYear() - 1); break;
    case "custom":
      fromDate = from ? new Date(from) : new Date(now.setDate(now.getDate() - 30)); break;
    default:
      fromDate = new Date(now); fromDate.setDate(now.getDate() - 30);
  }

  return { fromDate, toDate };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "30d";
    const from   = searchParams.get("from") || undefined;
    const to     = searchParams.get("to")   || undefined;

    const { fromDate, toDate } = getPeriodDates(period, from, to);
    const fromStr = fromDate.toISOString();
    const toStr   = toDate.toISOString();

    // ── 1. Summary ────────────────────────────────────────────────────────────
    const [summary] = await sequelize.query<{
      total_orders: string; total_revenue: string; avg_order_value: string;
      paid_orders: string; refunded_orders: string; cancelled_orders: string; delivered_orders: string;
    }>(`
      SELECT
        COUNT(*)                                                         AS total_orders,
        COALESCE(SUM(CASE WHEN "orderStatus" != 'cancelled' THEN "totalAmount" ELSE 0 END), 0) AS total_revenue,
        COALESCE(AVG(CASE WHEN "orderStatus" != 'cancelled' THEN "totalAmount" END), 0)        AS avg_order_value,
        COUNT(CASE WHEN "paymentStatus" = 'paid'     THEN 1 END)        AS paid_orders,
        COUNT(CASE WHEN "paymentStatus" = 'refunded' THEN 1 END)        AS refunded_orders,
        COUNT(CASE WHEN "orderStatus"   = 'cancelled' THEN 1 END)       AS cancelled_orders,
        COUNT(CASE WHEN "orderStatus"   = 'delivered' THEN 1 END)       AS delivered_orders
      FROM orders
      WHERE "createdAt" >= :from AND "createdAt" <= :to
    `, { replacements: { from: fromStr, to: toStr }, type: QueryTypes.SELECT });

    // ── 2. Daily revenue ──────────────────────────────────────────────────────
    const dailyRevenue = await sequelize.query<{ date: string; revenue: string; orders: string }>(`
      SELECT
        DATE("createdAt")                                                        AS date,
        COALESCE(SUM(CASE WHEN "orderStatus" != 'cancelled' THEN "totalAmount" ELSE 0 END), 0) AS revenue,
        COUNT(*)                                                                 AS orders
      FROM orders
      WHERE "createdAt" >= :from AND "createdAt" <= :to
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `, { replacements: { from: fromStr, to: toStr }, type: QueryTypes.SELECT });

    // ── 3. Top products by revenue ────────────────────────────────────────────
    const topProducts = await sequelize.query<{
      product_name: string; total_qty: string; total_revenue: string; order_count: string;
    }>(`
      SELECT
        oi."productName"       AS product_name,
        SUM(oi.quantity)       AS total_qty,
        SUM(oi."lineTotal")    AS total_revenue,
        COUNT(DISTINCT oi."orderId") AS order_count
      FROM order_items oi
      JOIN orders o ON o.id = oi."orderId"
      WHERE o."createdAt" >= :from AND o."createdAt" <= :to
        AND o."orderStatus" != 'cancelled'
      GROUP BY oi."productName"
      ORDER BY total_revenue DESC
      LIMIT 10
    `, { replacements: { from: fromStr, to: toStr }, type: QueryTypes.SELECT });

    // ── 4. Top categories ─────────────────────────────────────────────────────
    const topCategories = await sequelize.query<{
      category_name: string; total_revenue: string; order_count: string;
    }>(`
      SELECT
        c."categoryName"                  AS category_name,
        COALESCE(SUM(oi."lineTotal"), 0)  AS total_revenue,
        COUNT(DISTINCT o.id)              AS order_count
      FROM order_items oi
      JOIN products p ON p.id = oi."productId"
      JOIN categories c ON c.id = p."categoryId"
      JOIN orders o ON o.id = oi."orderId"
      WHERE o."createdAt" >= :from AND o."createdAt" <= :to
        AND o."orderStatus" != 'cancelled'
      GROUP BY c."categoryName"
      ORDER BY total_revenue DESC
      LIMIT 8
    `, { replacements: { from: fromStr, to: toStr }, type: QueryTypes.SELECT });

    // ── 5. Orders by status ───────────────────────────────────────────────────
    const ordersByStatus = await sequelize.query<{
      status: string; count: string; value: string;
    }>(`
      SELECT "orderStatus" AS status, COUNT(*) AS count, COALESCE(SUM("totalAmount"), 0) AS value
      FROM orders
      WHERE "createdAt" >= :from AND "createdAt" <= :to
      GROUP BY "orderStatus"
      ORDER BY count DESC
    `, { replacements: { from: fromStr, to: toStr }, type: QueryTypes.SELECT });

    // ── 6. Orders by payment method ───────────────────────────────────────────
    const ordersByPayment = await sequelize.query<{
      method: string; count: string; value: string;
    }>(`
      SELECT "paymentMethod" AS method, COUNT(*) AS count, COALESCE(SUM("totalAmount"), 0) AS value
      FROM orders
      WHERE "createdAt" >= :from AND "createdAt" <= :to
      GROUP BY "paymentMethod"
      ORDER BY count DESC
    `, { replacements: { from: fromStr, to: toStr }, type: QueryTypes.SELECT });

    // ── 7. Monthly revenue (last 12 months always) ────────────────────────────
    const revenueByMonth = await sequelize.query<{
      month: string; revenue: string; orders: string;
    }>(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month,
        COALESCE(SUM(CASE WHEN "orderStatus" != 'cancelled' THEN "totalAmount" ELSE 0 END), 0) AS revenue,
        COUNT(*) AS orders
      FROM orders
      WHERE "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `, { type: QueryTypes.SELECT });

    // ── 8. Customer breakdown ─────────────────────────────────────────────────
    const [customerStats] = await sequelize.query<{
      guest_orders: string; registered_orders: string;
    }>(`
      SELECT
        COUNT(CASE WHEN "isGuest" = true  THEN 1 END) AS guest_orders,
        COUNT(CASE WHEN "isGuest" = false THEN 1 END) AS registered_orders
      FROM orders
      WHERE "createdAt" >= :from AND "createdAt" <= :to
    `, { replacements: { from: fromStr, to: toStr }, type: QueryTypes.SELECT });

    // ── 9. Avg fulfillment time (pending → delivered) ─────────────────────────
    const [fulfillmentTime] = await sequelize.query<{ avg_hours: string }>(`
      SELECT COALESCE(
        EXTRACT(EPOCH FROM AVG("deliveredAt" - "createdAt")) / 3600,
        0
      ) AS avg_hours
      FROM orders
      WHERE "deliveredAt" IS NOT NULL
        AND "createdAt" >= :from AND "createdAt" <= :to
    `, { replacements: { from: fromStr, to: toStr }, type: QueryTypes.SELECT });

    return NextResponse.json({
      success: true,
      data: {
        period: { from: fromStr, to: toStr, label: period },
        summary: {
          totalOrders:      parseInt(summary.total_orders),
          totalRevenue:     parseFloat(summary.total_revenue),
          avgOrderValue:    parseFloat(summary.avg_order_value),
          paidOrders:       parseInt(summary.paid_orders),
          refundedOrders:   parseInt(summary.refunded_orders),
          cancelledOrders:  parseInt(summary.cancelled_orders),
          deliveredOrders:  parseInt(summary.delivered_orders),
          fulfillmentHours: parseFloat(fulfillmentTime.avg_hours || "0"),
        },
        dailyRevenue:     dailyRevenue.map(r => ({ date: r.date, revenue: parseFloat(r.revenue), orders: parseInt(r.orders) })),
        topProducts:      topProducts.map(p => ({ name: p.product_name, qty: parseInt(p.total_qty), revenue: parseFloat(p.total_revenue), orders: parseInt(p.order_count) })),
        topCategories:    topCategories.map(c => ({ name: c.category_name, revenue: parseFloat(c.total_revenue), orders: parseInt(c.order_count) })),
        ordersByStatus:   ordersByStatus.map(s => ({ status: s.status, count: parseInt(s.count), value: parseFloat(s.value) })),
        ordersByPayment:  ordersByPayment.map(p => ({ method: p.method, count: parseInt(p.count), value: parseFloat(p.value) })),
        revenueByMonth:   revenueByMonth.map(m => ({ month: m.month, revenue: parseFloat(m.revenue), orders: parseInt(m.orders) })),
        customerStats: {
          guestOrders:      parseInt(customerStats.guest_orders),
          registeredOrders: parseInt(customerStats.registered_orders),
        },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Reports API] Error:", message);
    return NextResponse.json({ success: false, message: `Failed to fetch reports: ${message}` }, { status: 500 });
  }
}
