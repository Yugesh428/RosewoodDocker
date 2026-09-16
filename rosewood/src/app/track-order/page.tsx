"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Package, Search, Loader2, CheckCircle2, XCircle } from "lucide-react";
import ProductImage from "@/components/ui/ProductImage";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product?: { productImage: string | null };
}

interface Order {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  deliveryAddress: string;
  deliveryNotes: string | null;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-yellow-50 text-yellow-700 border-yellow-200",
  confirmed:  "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-purple-50 text-purple-700 border-purple-200",
  shipped:    "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered:  "bg-green-50 text-green-700 border-green-200",
  cancelled:  "bg-red-50 text-red-700 border-red-200",
};

// ─── Inner component (uses useSearchParams — must be inside Suspense) ─────────

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const [orderId,  setOrderId]  = useState(searchParams.get("orderId") || "");
  const [email,    setEmail]    = useState(searchParams.get("email")   || "");
  const [order,    setOrder]    = useState<Order | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  // Auto-search if URL params present
  useEffect(() => {
    if (orderId && email && !searched) handleTrack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleTrack() {
    if (!orderId.trim() || !email.trim()) {
      setError("Please enter both Order ID and Email");
      return;
    }
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res  = await fetch("/api/orders/guest/track", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ orderId: orderId.trim(), email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || json.message || "Order not found");
      setOrder(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to track order");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-[#D4AF37]" />
        </div>
        <h1 className="text-3xl font-heading text-[#1A1A1A] mb-2">Track Your Order</h1>
        <p className="text-sm text-[#6B6B6B]">Enter your order details to check the status of your delivery</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-[#E5E5E5] p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
              Order ID <span className="text-red-500">*</span>
            </label>
            <input type="text" value={orderId} onChange={e => setOrderId(e.target.value)}
              placeholder="Enter your order ID"
              className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" />
          </div>
          <button onClick={handleTrack} disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#D4AF37] text-white font-semibold rounded-md hover:bg-[#b8952e] transition-colors disabled:opacity-50">
            {loading
              ? <><Loader2 className="w-5 h-5 animate-spin" />Searching...</>
              : <><Search className="w-5 h-5" />Track Order</>}
          </button>
        </div>
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div><p className="text-sm font-medium text-red-800">Error</p><p className="text-sm text-red-600 mt-1">{error}</p></div>
          </div>
        )}
      </div>

      {/* Results */}
      {order && (
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-[#6B6B6B] uppercase tracking-wider mb-1">Order Status</p>
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-full border ${STATUS_COLORS[order.orderStatus] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                  {order.orderStatus === "delivered" || order.orderStatus === "confirmed"
                    ? <CheckCircle2 className="w-4 h-4" />
                    : order.orderStatus === "cancelled"
                    ? <XCircle className="w-4 h-4" />
                    : <Package className="w-4 h-4" />}
                  {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#6B6B6B] uppercase tracking-wider mb-1">Order ID</p>
                <p className="text-sm font-mono font-medium text-[#1A1A1A]">#{order.id.slice(0, 8)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#E5E5E5]">
              <div>
                <p className="text-xs text-[#6B6B6B] uppercase tracking-wider mb-1">Order Date</p>
                <p className="text-sm font-medium text-[#1A1A1A]">
                  {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B] uppercase tracking-wider mb-1">Total</p>
                <p className="text-lg font-heading text-[#D4AF37]">£{Number(order.totalAmount).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
            <h3 className="font-heading text-[#1A1A1A] mb-4">Customer Details</h3>
            <div className="space-y-2 text-sm">
              {([["Name", order.guestName], ["Email", order.guestEmail], ["Phone", order.guestPhone]] as [string,string][]).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-[#6B6B6B]">{k}:</span>
                  <span className="font-medium text-[#1A1A1A]">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
            <h3 className="font-heading text-[#1A1A1A] mb-3">Delivery Address</h3>
            <p className="text-sm text-[#374151] whitespace-pre-line">{order.deliveryAddress}</p>
            {order.deliveryNotes && (
              <div className="mt-3 pt-3 border-t border-[#E5E5E5]">
                <p className="text-xs text-[#6B6B6B] uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-[#374151]">{order.deliveryNotes}</p>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
            <h3 className="font-heading text-[#1A1A1A] mb-4">Order Items</h3>
            <div className="space-y-4">
              {order.items.map(item => (
                <div key={item.id} className="flex gap-4 pb-4 border-b border-[#E5E5E5] last:border-0 last:pb-0">
                  <div className="w-16 h-16 flex-shrink-0 bg-[#F9F9F9] rounded border border-[#E5E5E5] overflow-hidden">
                    <ProductImage src={item.product?.productImage || ""} alt={item.productName} width={64} height={64} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[#1A1A1A]">{item.productName}</p>
                    <p className="text-sm text-[#6B6B6B] mt-0.5">Qty: {item.quantity}</p>
                    <p className="text-sm font-semibold text-[#1A1A1A] mt-1">£{Number(item.lineTotal).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <Link href="/pharmacy" className="px-6 py-2.5 bg-[#D4AF37] text-white font-semibold rounded-md hover:bg-[#b8952e] transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
      )}

      <div className="text-center mt-8">
        <p className="text-sm text-[#6B6B6B]">
          Need help?{" "}
          <a href="mailto:support@rosewood.com" className="text-[#D4AF37] hover:underline">support@rosewood.com</a>
        </p>
      </div>
    </div>
  );
}

// ─── Page export — Suspense wrapper required for useSearchParams ──────────────

export default function TrackOrderPage() {
  return (
    <div className="min-h-screen bg-[#F9F9F9] py-12">
      <Suspense fallback={
        <div className="flex justify-center items-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
        </div>
      }>
        <TrackOrderContent />
      </Suspense>
    </div>
  );
}
