"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, Minus, Users, Zap, Clock, Tag, BarChart2, Activity, RefreshCw, Sparkles, ArrowUpRight, Target,
} from "lucide-react";
import { Card } from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  growthTrend: {
    monthly: { revenueGrowth: number; orderGrowth: number; currentRevenue: number; previousRevenue: number; currentOrders: number; previousOrders: number };
    weekly:  { revenueGrowth: number; orderGrowth: number; currentRevenue: number; previousRevenue: number; currentOrders: number; previousOrders: number };
  };
  salesForecast: {
    historical: { date: string; revenue: number }[];
    forecast:   { date: string; projectedRevenue: number }[];
    trend: "up" | "down" | "flat";
    dailySlope: number;
  };
  hourlyOrders: { hour: number; count: number; revenue: number }[];
  weekdayOrders: { day: string; count: number; revenue: number }[];
  customerRetention: {
    totalCustomers: number; repeatCustomers: number; retentionRate: number;
    topRepeaters: { customerId: string; orderCount: number; totalSpent: number }[];
  };
  basketTrend: { week: string; avgBasket: number; avgItems: number }[];
  productVelocity: { name: string; totalQty: number; daysActive: number; unitsPerDay: number }[];
  discountImpact: {
    withDiscount: { orders: number; revenue: number };
    withoutDiscount: { orders: number; revenue: number };
    totalDiscountGiven: number;
  };
  categoryShare: { name: string; revenue: number; pct: number }[];
}

const formatMoney = (value: number, fractionDigits = 0) =>
  `£${value.toLocaleString(undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function GrowthBadge({ value }: { value: number }) {
  if (value > 0) return (
    <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-sm">
      <TrendingUp className="w-3 h-3" />+{value.toFixed(1)}%
    </span>
  );
  if (value < 0) return (
    <span className="flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-sm">
      <TrendingDown className="w-3 h-3" />{value.toFixed(1)}%
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-sm">
      <Minus className="w-3 h-3" />0%
    </span>
  );
}

function SectionTitle({ icon: Icon, children, subtitle }: { icon: React.ElementType; children: React.ReactNode; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="p-1.5 rounded-sm bg-gray-50">
        <Icon className="w-3.5 h-3.5 text-[#D4AF37]" />
      </div>
      <div>
        <h3 className="text-[10px] tracking-[0.2em] uppercase text-gray-700 font-sans font-semibold">{children}</h3>
        {subtitle && <p className="text-[9px] text-gray-400 font-sans">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Forecast SVG chart ───────────────────────────────────────────────────────

function ForecastChart({ historical, forecast }: {
  historical: { date: string; revenue: number }[];
  forecast:   { date: string; projectedRevenue: number }[];
}) {
  const allVals = [...historical.map(h => h.revenue), ...forecast.map(f => f.projectedRevenue)];
  const max = Math.max(...allVals) || 1;
  const W = 600; const H = 160; const PAD = 30;
  const total = historical.length + forecast.length;

  const toXY = (i: number, v: number) => ({
    x: PAD + (i / Math.max(total - 1, 1)) * (W - PAD * 2),
    y: H - PAD - ((v / max) * (H - PAD * 2)),
  });

  const histPts = historical.map((h, i) => toXY(i, h.revenue));
  const forecastPts = forecast.map((f, i) => toXY(historical.length + i, f.projectedRevenue));

  const toPath = (pts: {x:number;y:number}[]) =>
    pts.length < 2 ? "" : pts.map((p, i) => `${i===0?"M":"L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  const histPath = toPath(histPts);
  const joinPt   = histPts[histPts.length - 1];
  const fcastPath = joinPt && forecastPts.length > 0
    ? `M ${joinPt.x.toFixed(1)} ${joinPt.y.toFixed(1)} ` + toPath(forecastPts).slice(1)
    : "";

  return (
    <div>
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 300, height: H }}>
          {/* Grid */}
          {[0,0.25,0.5,0.75,1].map(pct => {
            const y = H - PAD - pct * (H - PAD*2);
            return (
              <g key={pct}>
                <line x1={PAD} x2={W-PAD} y1={y} y2={y} stroke="#F3F4F6" strokeWidth="1"/>
                <text x={PAD-4} y={y+4} textAnchor="end" fontSize="8" fill="#9CA3AF">
                  £{((pct*max)/1000).toFixed(0)}k
                </text>
              </g>
            );
          })}
          {/* Hist fill */}
          {histPts.length > 1 && (
            <path d={`${histPath} L ${histPts[histPts.length-1].x} ${H-PAD} L ${histPts[0].x} ${H-PAD} Z`}
              fill="#D4AF37" opacity="0.08" />
          )}
          {/* Forecast fill */}
          {forecastPts.length > 1 && joinPt && (
            <path d={`${fcastPath} L ${forecastPts[forecastPts.length-1].x} ${H-PAD} L ${joinPt.x} ${H-PAD} Z`}
              fill="#3B82F6" opacity="0.06" />
          )}
          {/* Hist line */}
          {histPts.length > 1 && <path d={histPath} fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />}
          {/* Forecast line */}
          {fcastPath && <path d={fcastPath} fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="5,4" strokeLinecap="round" />}
          {/* Divider */}
          {joinPt && <line x1={joinPt.x} x2={joinPt.x} y1={PAD} y2={H-PAD} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4,3"/>}
          <defs>
            <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4AF37" /><stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="flex items-center gap-6 mt-2 text-[10px] text-gray-400 font-sans">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-0.5 rounded-full bg-[#D4AF37]" /><span>Historical (90 days)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-0.5 rounded-full border-t border-dashed border-blue-500" /><span>Forecast (30 days)</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true); setError(null);
    fetch("/api/admin/analytics")
      .then(r => r.json())
      .then(json => { if (!json.success) throw new Error(json.message); setData(json.data); })
      .catch(e => setError(e instanceof Error ? e.message : "Failed to load analytics"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timeout = window.setTimeout(fetchData, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const catColors = ["#D4AF37","#3B82F6","#8B5CF6","#10B981","#F59E0B","#EF4444","#06B6D4","#EC4899"];

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* Page header */}
      <div className="border-b border-[#D4AF37]/20 bg-[#171713] sticky top-0 z-10 shadow-[0_4px_20px_rgba(0,0,0,0.14)]">
        <div className="px-5 py-5 lg:px-8 lg:py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.24em] uppercase text-[#D4AF37]"><Sparkles className="h-3 w-3" /> Decision workspace</p>
              <h1 className="text-2xl font-heading text-white">Analytics</h1>
              <p className="text-sm text-white/55 mt-1 font-sans">Growth trends · Sales forecasting · Behavioral insights</p>
            </div>
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-2 px-3 py-2 border border-white/15 rounded-md text-sm text-white/80 bg-white/5 hover:bg-white/10 transition-colors font-sans">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 lg:p-8">
        {error && (
          <div className="mb-6 p-4 rounded-sm border border-red-200 bg-red-50 text-red-700 text-sm font-sans">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data ? (
          <div className="space-y-6">

            {/* ── Growth KPIs ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "MoM Revenue",    value: `£${data.growthTrend.monthly.currentRevenue.toFixed(0)}`,  growth: data.growthTrend.monthly.revenueGrowth, sub: `vs £${data.growthTrend.monthly.previousRevenue.toFixed(0)} prev month` },
                { label: "MoM Orders",     value: `${data.growthTrend.monthly.currentOrders}`,              growth: data.growthTrend.monthly.orderGrowth,   sub: `vs ${data.growthTrend.monthly.previousOrders} prev month` },
                { label: "WoW Revenue",    value: `£${data.growthTrend.weekly.currentRevenue.toFixed(0)}`,   growth: data.growthTrend.weekly.revenueGrowth,  sub: `vs £${data.growthTrend.weekly.previousRevenue.toFixed(0)} last week` },
                { label: "WoW Orders",     value: `${data.growthTrend.weekly.currentOrders}`,               growth: data.growthTrend.weekly.orderGrowth,    sub: `vs ${data.growthTrend.weekly.previousOrders} last week` },
              ].map((item, i) => (
                <Card key={i} className="relative overflow-hidden p-5 border border-[#E8E4DC] bg-white shadow-[0_10px_30px_rgba(38,31,18,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(38,31,18,0.10)]">
                  <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#b8952e] via-[#ffe87c] to-[#D4AF37] opacity-80" />
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-sans">{item.label}</p>
                    <GrowthBadge value={item.growth} />
                  </div>
                  <h3 className="text-3xl font-heading text-gray-900 mb-1">{item.value}</h3>
                  <p className="text-xs text-gray-400 font-sans">{item.sub}</p>
                </Card>
              ))}
            </div>

            <Card className="overflow-hidden border border-[#E3D5A6] bg-gradient-to-r from-[#1A1A1A] via-[#242117] to-[#1A1A1A] p-0 shadow-[0_14px_28px_rgba(26,26,26,0.16)]">
              <div className="grid divide-y divide-white/10 md:grid-cols-3 md:divide-x md:divide-y-0">
                <div className="p-5">
                  <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] uppercase text-[#ffe87c]"><Target className="h-3.5 w-3.5" /> Forecast signal</p>
                  <p className="text-base font-heading text-white">{data.salesForecast.trend === "up" ? "Demand is trending upward" : data.salesForecast.trend === "down" ? "Demand needs attention" : "Demand is holding steady"}</p>
                  <p className="mt-1 text-xs text-white/55">Projected daily movement: {data.salesForecast.dailySlope >= 0 ? "+" : ""}{formatMoney(data.salesForecast.dailySlope, 2)}.</p>
                </div>
                <div className="p-5">
                  <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#ffe87c]">Peak order day</p>
                  <p className="mt-2 text-base font-heading text-white">{[...data.weekdayOrders].sort((a, b) => b.count - a.count)[0]?.day || "No data"}</p>
                  <p className="mt-1 text-xs text-white/55">{[...data.weekdayOrders].sort((a, b) => b.count - a.count)[0]?.count || 0} orders in the last 90 days.</p>
                </div>
                <div className="p-5">
                  <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#ffe87c]">Fastest mover</p>
                  <p className="mt-2 truncate text-base font-heading text-white">{data.productVelocity[0]?.name || "No product data"}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-white/55"><ArrowUpRight className="h-3.5 w-3.5 text-[#D4AF37]" /> {data.productVelocity[0] ? `${data.productVelocity[0].unitsPerDay} units per day` : "Order activity will appear here."}</p>
                </div>
              </div>
            </Card>

            {/* ── Sales Forecast ── */}
            <Card className="p-6 border border-[#E8E4DC] shadow-sm">
              <SectionTitle icon={Activity} subtitle="Linear regression on last 90 days · 30-day projection">
                Sales Forecast
              </SectionTitle>
              <div className="flex items-center gap-3 mb-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-semibold ${
                  data.salesForecast.trend === "up"   ? "bg-green-50 text-green-700" :
                  data.salesForecast.trend === "down" ? "bg-red-50 text-red-700"     :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {data.salesForecast.trend === "up"   ? <TrendingUp className="w-3.5 h-3.5" /> :
                   data.salesForecast.trend === "down" ? <TrendingDown className="w-3.5 h-3.5" /> :
                   <Minus className="w-3.5 h-3.5" />}
                  Trend: {data.salesForecast.trend}
                </span>
                <span className="text-xs text-gray-400 font-sans">
                  Daily slope: {data.salesForecast.dailySlope >= 0 ? "+" : ""}£{data.salesForecast.dailySlope}/day
                </span>
              </div>
              <ForecastChart historical={data.salesForecast.historical} forecast={data.salesForecast.forecast} />
            </Card>

            {/* ── Heatmaps ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hourly heatmap */}
              <Card className="p-6 border border-gray-200">
                <SectionTitle icon={Clock} subtitle="Orders per hour of day (last 90 days)">
                  Orders by Hour
                </SectionTitle>
                <div className="grid grid-cols-12 gap-1">
                  {data.hourlyOrders.map(h => {
                    const max = Math.max(...data.hourlyOrders.map(x => x.count)) || 1;
                    const intensity = h.count / max;
                    return (
                      <div key={h.hour} className="flex flex-col items-center rounded-sm p-1 text-center transition-all group relative"
                        style={{ backgroundColor: `rgba(212,175,55,${0.06 + intensity * 0.7})`, minHeight: 40 }}
                        title={`${h.hour}:00 — ${h.count} orders`}>
                        <span className="text-[8px] text-gray-500 font-sans">{h.hour}h</span>
                        <span className="text-[9px] font-bold text-gray-700">{h.count}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1 text-[9px] text-gray-400 font-sans">
                  <span>12am</span><span>12pm</span><span>11pm</span>
                </div>
              </Card>

              {/* Weekday chart */}
              <Card className="p-6 border border-gray-200">
                <SectionTitle icon={BarChart2} subtitle="Busiest days of the week">
                  Orders by Weekday
                </SectionTitle>
                <div className="space-y-2">
                  {data.weekdayOrders.map((d, i) => {
                    const max = Math.max(...data.weekdayOrders.map(x => x.count)) || 1;
                    const pct = (d.count / max) * 100;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-500 font-sans w-12 flex-shrink-0">{d.day.slice(0,3)}</span>
                        <div className="flex-1 h-7 rounded-md bg-[#F6F4EE] ring-1 ring-[#E8E4DC] overflow-hidden">
                          <div className="h-full min-w-[2px] rounded-md flex items-center justify-between px-2 transition-all duration-500"
                            style={{ width: `${pct}%`, background: "linear-gradient(90deg, #b8952e 0%, #D4AF37 55%, #ffe87c 100%)" }}>
                            {pct > 22 && <span className="text-[9px] text-[#1A1A1A] font-bold">{d.count} orders</span>}
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-gray-600 w-7 text-right">{d.count}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* ── Retention + Basket Trend ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Retention */}
              <Card className="p-6 border border-gray-200">
                <SectionTitle icon={Users} subtitle="Registered customers who ordered more than once">
                  Customer Retention
                </SectionTitle>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: "Total Customers",  value: data.customerRetention.totalCustomers,  color: "text-gray-900" },
                    { label: "Repeat Customers", value: data.customerRetention.repeatCustomers, color: "text-[#D4AF37]" },
                    { label: "Retention Rate",   value: `${data.customerRetention.retentionRate}%`, color: "text-green-600" },
                  ].map((item, i) => (
                    <div key={i} className="text-center p-3 rounded-sm bg-gray-50 border border-gray-100">
                      <p className={`text-xl font-heading ${item.color}`}>{item.value}</p>
                      <p className="text-[9px] text-gray-500 font-sans mt-0.5">{item.label}</p>
                    </div>
                  ))}
                </div>
                {data.customerRetention.topRepeaters.length > 0 && (
                  <>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-sans mb-2">Top Repeat Buyers</p>
                    <div className="space-y-1.5">
                      {data.customerRetention.topRepeaters.slice(0, 5).map((r, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-sm bg-gray-50 border border-gray-100">
                          <span className="text-[10px] text-gray-500 font-mono">{r.customerId.slice(0,8)}…</span>
                          <span className="text-[10px] text-gray-500 font-sans">{r.orderCount} orders</span>
                          <span className="text-xs font-semibold text-[#D4AF37] font-sans">£{r.totalSpent.toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>

              {/* Basket trend */}
              <Card className="p-6 border border-gray-200">
                <SectionTitle icon={Zap} subtitle="Weekly average order value — last 8 weeks">
                  Avg Basket Trend
                </SectionTitle>
                {data.basketTrend.length > 0 ? (
                  <div className="space-y-2">
                    {data.basketTrend.slice(-8).map((b, i, arr) => {
                      const prev = arr[i - 1];
                      const change = prev ? ((b.avgBasket - prev.avgBasket) / prev.avgBasket) * 100 : 0;
                      return (
                        <div key={i} className="flex items-center justify-between px-3 py-2 rounded-sm bg-gray-50 border border-gray-100">
                          <span className="text-[10px] text-gray-400 font-sans w-14">{b.week.slice(5)}</span>
                          <span className="text-sm font-semibold text-gray-900 font-heading">£{b.avgBasket}</span>
                          <span className="text-[10px] text-gray-400 font-sans">{b.avgItems} items</span>
                          {i > 0 && (
                            <span className={`text-[10px] font-semibold ${change >= 0 ? "text-green-600" : "text-red-500"}`}>
                              {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-8 font-sans">Not enough order data yet</p>
                )}
              </Card>
            </div>

            {/* ── Product Velocity + Discount Impact ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Velocity */}
              <Card className="p-6 border border-gray-200">
                <SectionTitle icon={Zap} subtitle="Units sold per day — last 30 days">
                  Product Velocity
                </SectionTitle>
                {data.productVelocity.length > 0 ? (
                  <div className="space-y-3">
                    {data.productVelocity.map((p, i) => {
                      const max = data.productVelocity[0].unitsPerDay || 1;
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-700 font-sans truncate flex-1 mr-2">{p.name}</span>
                            <span className="text-xs font-semibold text-[#D4AF37] flex-shrink-0 font-sans">{p.unitsPerDay}/day</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-gray-100">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${(p.unitsPerDay / max) * 100}%`, backgroundColor: i === 0 ? "#D4AF37" : "#3B82F6" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-8 font-sans">No velocity data yet</p>
                )}
              </Card>

              {/* Discount impact */}
              <Card className="p-6 border border-gray-200">
                <SectionTitle icon={Tag} subtitle="Revenue comparison — last 90 days">
                  Discount Impact
                </SectionTitle>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-4 rounded-sm bg-yellow-50 border border-yellow-200 text-center">
                    <p className="text-2xl font-heading text-[#D4AF37]">{data.discountImpact.withDiscount.orders}</p>
                    <p className="text-[9px] text-gray-500 font-sans mt-0.5">Orders w/ Discount</p>
                    <p className="text-xs font-semibold text-gray-700 font-sans mt-1">£{data.discountImpact.withDiscount.revenue.toFixed(0)}</p>
                  </div>
                  <div className="p-4 rounded-sm bg-gray-50 border border-gray-200 text-center">
                    <p className="text-2xl font-heading text-gray-900">{data.discountImpact.withoutDiscount.orders}</p>
                    <p className="text-[9px] text-gray-500 font-sans mt-0.5">No Discount</p>
                    <p className="text-xs font-semibold text-gray-700 font-sans mt-1">£{data.discountImpact.withoutDiscount.revenue.toFixed(0)}</p>
                  </div>
                </div>
                <div className="p-3 rounded-sm bg-red-50 border border-red-200 flex items-center justify-between">
                  <span className="text-xs text-gray-600 font-sans">Total Discounts Given</span>
                  <span className="text-sm font-bold text-red-600 font-heading">-£{data.discountImpact.totalDiscountGiven.toFixed(2)}</span>
                </div>
              </Card>
            </div>

            {/* ── Category Share ── */}
            {data.categoryShare.length > 0 && (
              <Card className="p-6 border border-gray-200">
                <SectionTitle icon={BarChart2} subtitle="Revenue share by category — last 30 days">
                  Category Revenue Share
                </SectionTitle>
                <div className="space-y-3">
                  {data.categoryShare.map((c, i) => {
                    const col = catColors[i % catColors.length];
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: col }} />
                        <span className="text-xs text-gray-700 font-sans flex-1 truncate">{c.name}</span>
                        <div className="w-48 h-2 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${c.pct}%`, backgroundColor: col }} />
                        </div>
                        <span className="text-xs font-bold w-10 text-right flex-shrink-0 font-sans" style={{ color: col }}>{c.pct}%</span>
                        <span className="text-[10px] text-gray-400 w-16 text-right font-sans flex-shrink-0">£{c.revenue.toFixed(0)}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

          </div>
        ) : null}
      </div>
    </div>
  );
}
