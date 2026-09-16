export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import sequelize from "@/lib/database/sequelize";
import { QueryTypes } from "sequelize";

/**
 * GET /api/admin/analytics
 * Deep analytics: trends, forecasting, cohort data, product performance
 *
 * Returns:
 *   - growthTrend: MoM/WoW revenue & order growth %
 *   - salesForecast: simple linear projection for next 30 days
 *   - repeatCustomers: customer retention data
 *   - hourlyOrders: orders by hour of day (heatmap data)
 *   - weekdayOrders: orders by day of week
 *   - avgBasketSize: trending over time
 *   - productVelocity: fastest/slowest moving products
 *   - revenuePerCategory: share breakdown
 *   - discountImpact: revenue with vs without discount
 */

export async function GET(_req: NextRequest) {
  try {
    const now = new Date();

    // ── 1. MoM Growth (current month vs previous month) ───────────────────────
    const [currentMonth] = await sequelize.query<{ revenue: string; orders: string }>(`
      SELECT
        COALESCE(SUM(CASE WHEN "orderStatus" != 'cancelled' THEN "totalAmount" ELSE 0 END), 0) AS revenue,
        COUNT(*) AS orders
      FROM orders
      WHERE DATE_TRUNC('month', "createdAt") = DATE_TRUNC('month', NOW())
    `, { type: QueryTypes.SELECT });

    const [prevMonth] = await sequelize.query<{ revenue: string; orders: string }>(`
      SELECT
        COALESCE(SUM(CASE WHEN "orderStatus" != 'cancelled' THEN "totalAmount" ELSE 0 END), 0) AS revenue,
        COUNT(*) AS orders
      FROM orders
      WHERE DATE_TRUNC('month', "createdAt") = DATE_TRUNC('month', NOW() - INTERVAL '1 month')
    `, { type: QueryTypes.SELECT });

    const [currentWeek] = await sequelize.query<{ revenue: string; orders: string }>(`
      SELECT
        COALESCE(SUM(CASE WHEN "orderStatus" != 'cancelled' THEN "totalAmount" ELSE 0 END), 0) AS revenue,
        COUNT(*) AS orders
      FROM orders
      WHERE "createdAt" >= DATE_TRUNC('week', NOW())
    `, { type: QueryTypes.SELECT });

    const [prevWeek] = await sequelize.query<{ revenue: string; orders: string }>(`
      SELECT
        COALESCE(SUM(CASE WHEN "orderStatus" != 'cancelled' THEN "totalAmount" ELSE 0 END), 0) AS revenue,
        COUNT(*) AS orders
      FROM orders
      WHERE "createdAt" >= DATE_TRUNC('week', NOW() - INTERVAL '1 week')
        AND "createdAt" < DATE_TRUNC('week', NOW())
    `, { type: QueryTypes.SELECT });

    const calcGrowth = (cur: number, prev: number) =>
      prev === 0 ? (cur > 0 ? 100 : 0) : parseFloat((((cur - prev) / prev) * 100).toFixed(1));

    const curRevenue = parseFloat(currentMonth.revenue);
    const prevRevenue = parseFloat(prevMonth.revenue);
    const curOrders = parseInt(currentMonth.orders);
    const prevOrders = parseInt(prevMonth.orders);
    const curWRev = parseFloat(currentWeek.revenue);
    const prevWRev = parseFloat(prevWeek.revenue);
    const curWOrd = parseInt(currentWeek.orders);
    const prevWOrd = parseInt(prevWeek.orders);

    // ── 2. Sales Forecast (linear regression on last 90 days daily data) ─────
    const last90Days = await sequelize.query<{ date: string; revenue: string }>(`
      SELECT
        DATE("createdAt") AS date,
        COALESCE(SUM(CASE WHEN "orderStatus" != 'cancelled' THEN "totalAmount" ELSE 0 END), 0) AS revenue
      FROM orders
      WHERE "createdAt" >= NOW() - INTERVAL '90 days'
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `, { type: QueryTypes.SELECT });

    // Simple linear regression for forecast
    const n = last90Days.length;
    const xValues = last90Days.map((_, i) => i);
    const yValues = last90Days.map(d => parseFloat(d.revenue));
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((acc, x, i) => acc + x * yValues[i], 0);
    const sumX2 = xValues.reduce((acc, x) => acc + x * x, 0);
    const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) : 0;
    const intercept = n > 0 ? (sumY - slope * sumX) / n : 0;

    const forecast = Array.from({ length: 30 }, (_, i) => {
      const dayIndex = n + i;
      const forecastDate = new Date(now);
      forecastDate.setDate(now.getDate() + i + 1);
      return {
        date: forecastDate.toISOString().split("T")[0],
        projectedRevenue: Math.max(0, parseFloat((slope * dayIndex + intercept).toFixed(2))),
        isForecast: true,
      };
    });

    const historicalForChart = last90Days.map(d => ({
      date: d.date,
      revenue: parseFloat(d.revenue),
      isForecast: false,
    }));

    // ── 3. Hourly order distribution ──────────────────────────────────────────
    const hourlyOrders = await sequelize.query<{ hour: string; count: string; revenue: string }>(`
      SELECT
        EXTRACT(HOUR FROM "createdAt") AS hour,
        COUNT(*) AS count,
        COALESCE(SUM("totalAmount"), 0) AS revenue
      FROM orders
      WHERE "createdAt" >= NOW() - INTERVAL '90 days'
      GROUP BY EXTRACT(HOUR FROM "createdAt")
      ORDER BY hour ASC
    `, { type: QueryTypes.SELECT });

    // ── 4. Weekday order distribution ─────────────────────────────────────────
    const weekdayOrders = await sequelize.query<{ dow: string; count: string; revenue: string }>(`
      SELECT
        EXTRACT(DOW FROM "createdAt") AS dow,
        COUNT(*) AS count,
        COALESCE(SUM("totalAmount"), 0) AS revenue
      FROM orders
      WHERE "createdAt" >= NOW() - INTERVAL '90 days'
      GROUP BY EXTRACT(DOW FROM "createdAt")
      ORDER BY dow ASC
    `, { type: QueryTypes.SELECT });

    const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

    // ── 5. Repeat customers ───────────────────────────────────────────────────
    const repeatCustomers = await sequelize.query<{ customer_id: string; order_count: string; total_spent: string }>(`
      SELECT
        "customerId" AS customer_id,
        COUNT(*) AS order_count,
        SUM("totalAmount") AS total_spent
      FROM orders
      WHERE "isGuest" = false
        AND "customerId" IS NOT NULL
        AND "orderStatus" != 'cancelled'
      GROUP BY "customerId"
      HAVING COUNT(*) > 1
      ORDER BY order_count DESC
      LIMIT 10
    `, { type: QueryTypes.SELECT });

    const [retentionStats] = await sequelize.query<{
      total_customers: string; repeat_customers: string;
    }>(`
      SELECT
        COUNT(DISTINCT customer_id) AS total_customers,
        COUNT(DISTINCT CASE WHEN order_count > 1 THEN customer_id ELSE NULL END) AS repeat_customers
      FROM (
        SELECT "customerId" AS customer_id, COUNT(*) AS order_count
        FROM orders
        WHERE "isGuest" = false AND "customerId" IS NOT NULL AND "orderStatus" != 'cancelled'
        GROUP BY "customerId"
      ) sub
    `, { type: QueryTypes.SELECT });

    // ── 6. Avg basket size over time (weekly) ─────────────────────────────────
    const basketTrend = await sequelize.query<{ week: string; avg_basket: string; avg_items: string }>(`
      SELECT
        TO_CHAR(DATE_TRUNC('week', o."createdAt"), 'YYYY-MM-DD') AS week,
        AVG(o."totalAmount") AS avg_basket,
        AVG(item_counts.item_count) AS avg_items
      FROM orders o
      JOIN (
        SELECT "orderId", COUNT(*) AS item_count, SUM(quantity) AS total_qty
        FROM order_items
        GROUP BY "orderId"
      ) item_counts ON item_counts."orderId" = o.id
      WHERE o."createdAt" >= NOW() - INTERVAL '12 weeks'
        AND o."orderStatus" != 'cancelled'
      GROUP BY DATE_TRUNC('week', o."createdAt")
      ORDER BY week ASC
    `, { type: QueryTypes.SELECT });

    // ── 7. Product velocity (units/day) ───────────────────────────────────────
    const productVelocity = await sequelize.query<{
      product_name: string; total_qty: string; days_active: string; velocity: string;
    }>(`
      SELECT
        oi."productName" AS product_name,
        SUM(oi.quantity) AS total_qty,
        COUNT(DISTINCT DATE(o."createdAt")) AS days_active,
        ROUND(SUM(oi.quantity)::NUMERIC / GREATEST(COUNT(DISTINCT DATE(o."createdAt")), 1), 2) AS velocity
      FROM order_items oi
      JOIN orders o ON o.id = oi."orderId"
      WHERE o."createdAt" >= NOW() - INTERVAL '30 days'
        AND o."orderStatus" != 'cancelled'
      GROUP BY oi."productName"
      ORDER BY velocity DESC
      LIMIT 10
    `, { type: QueryTypes.SELECT });

    // ── 8. Discount impact ────────────────────────────────────────────────────
    const [discountImpact] = await sequelize.query<{
      orders_with_discount: string; revenue_with_discount: string;
      orders_no_discount: string;   revenue_no_discount: string;
      total_discount_given: string;
    }>(`
      SELECT
        COUNT(CASE WHEN "discountAmount" > 0 THEN 1 END) AS orders_with_discount,
        COALESCE(SUM(CASE WHEN "discountAmount" > 0 THEN "totalAmount" ELSE 0 END), 0) AS revenue_with_discount,
        COUNT(CASE WHEN "discountAmount" = 0 THEN 1 END) AS orders_no_discount,
        COALESCE(SUM(CASE WHEN "discountAmount" = 0 THEN "totalAmount" ELSE 0 END), 0) AS revenue_no_discount,
        COALESCE(SUM("discountAmount"), 0) AS total_discount_given
      FROM orders
      WHERE "createdAt" >= NOW() - INTERVAL '90 days'
        AND "orderStatus" != 'cancelled'
    `, { type: QueryTypes.SELECT });

    // ── 9. Revenue by category share ─────────────────────────────────────────
    const categoryShare = await sequelize.query<{
      category_name: string; revenue: string; pct: string;
    }>(`
      WITH cat_rev AS (
        SELECT c."categoryName" AS cat, SUM(oi."lineTotal") AS rev
        FROM order_items oi
        JOIN products p ON p.id = oi."productId"
        JOIN categories c ON c.id = p."categoryId"
        JOIN orders o ON o.id = oi."orderId"
        WHERE o."createdAt" >= NOW() - INTERVAL '30 days'
          AND o."orderStatus" != 'cancelled'
        GROUP BY c."categoryName"
      ),
      total AS (SELECT SUM(rev) AS t FROM cat_rev)
      SELECT cat AS category_name, rev AS revenue,
             ROUND((rev / NULLIF(t, 0)) * 100, 1) AS pct
      FROM cat_rev, total
      ORDER BY rev DESC
    `, { type: QueryTypes.SELECT });

    return NextResponse.json({
      success: true,
      data: {
        growthTrend: {
          monthly: {
            revenueGrowth: calcGrowth(curRevenue, prevRevenue),
            orderGrowth:   calcGrowth(curOrders, prevOrders),
            currentRevenue: curRevenue,
            previousRevenue: prevRevenue,
            currentOrders: curOrders,
            previousOrders: prevOrders,
          },
          weekly: {
            revenueGrowth: calcGrowth(curWRev, prevWRev),
            orderGrowth:   calcGrowth(curWOrd, prevWOrd),
            currentRevenue: curWRev,
            previousRevenue: prevWRev,
            currentOrders: curWOrd,
            previousOrders: prevWOrd,
          },
        },
        salesForecast: {
          historical: historicalForChart,
          forecast,
          trend: slope > 0 ? "up" : slope < 0 ? "down" : "flat",
          dailySlope: parseFloat(slope.toFixed(2)),
        },
        hourlyOrders: Array.from({ length: 24 }, (_, h) => {
          const found = hourlyOrders.find(r => parseInt(r.hour) === h);
          return { hour: h, count: found ? parseInt(found.count) : 0, revenue: found ? parseFloat(found.revenue) : 0 };
        }),
        weekdayOrders: Array.from({ length: 7 }, (_, d) => {
          const found = weekdayOrders.find(r => parseInt(r.dow) === d);
          return { day: DAYS[d], count: found ? parseInt(found.count) : 0, revenue: found ? parseFloat(found.revenue) : 0 };
        }),
        customerRetention: {
          totalCustomers:   parseInt(retentionStats?.total_customers  || "0"),
          repeatCustomers:  parseInt(retentionStats?.repeat_customers || "0"),
          retentionRate: (() => {
            const total  = parseInt(retentionStats?.total_customers  || "0");
            const repeat = parseInt(retentionStats?.repeat_customers || "0");
            return total > 0 ? parseFloat(((repeat / total) * 100).toFixed(1)) : 0;
          })(),
          topRepeaters: repeatCustomers.map(r => ({
            customerId: r.customer_id,
            orderCount: parseInt(r.order_count),
            totalSpent: parseFloat(r.total_spent || "0"),
          })),
        },
        basketTrend: basketTrend.map(b => ({
          week: b.week,
          avgBasket: parseFloat(parseFloat(b.avg_basket).toFixed(2)),
          avgItems:  parseFloat(parseFloat(b.avg_items).toFixed(1)),
        })),
        productVelocity: productVelocity.map(p => ({
          name:     p.product_name,
          totalQty: parseInt(p.total_qty),
          daysActive: parseInt(p.days_active),
          unitsPerDay: parseFloat(p.velocity),
        })),
        discountImpact: {
          withDiscount:    { orders: parseInt(discountImpact?.orders_with_discount || "0"), revenue: parseFloat(discountImpact?.revenue_with_discount || "0") },
          withoutDiscount: { orders: parseInt(discountImpact?.orders_no_discount   || "0"), revenue: parseFloat(discountImpact?.revenue_no_discount   || "0") },
          totalDiscountGiven: parseFloat(discountImpact?.total_discount_given || "0"),
        },
        categoryShare: categoryShare.map(c => ({
          name: c.category_name,
          revenue: parseFloat(c.revenue),
          pct: parseFloat(c.pct),
        })),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack   = err instanceof Error ? err.stack   : undefined;
    console.error("[Analytics API] Error:", message);
    if (stack) console.error(stack);
    return NextResponse.json({ success: false, message: `Failed to fetch analytics: ${message}` }, { status: 500 });
  }
}
