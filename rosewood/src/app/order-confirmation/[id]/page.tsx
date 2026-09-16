"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Package, MapPin, CreditCard, Loader2, Home, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import ProductImage from "@/components/ui/ProductImage";

interface OrderItem {
  id: string;
  productId: string;
  inventoryId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  productName: string;
  product?: {
    id: string;
    productName: string;
    productImage: string | null;
  };
}

interface Order {
  id: string;
  customerId: string | null;
  isGuest: boolean;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  paymentMethod: string;
  deliveryAddress: string;
  deliveryNotes: string | null;
  orderStatus: string;
  paymentStatus: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
  customer?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const email = searchParams.get("email");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const isNewOrder = searchParams.get("new") === "1";

  // Fire success toast once when landing from checkout
  useEffect(() => {
    if (!isNewOrder) return;
    const raw = sessionStorage.getItem("orderSuccess");
    if (!raw) return;
    try {
      const { orderId, shortId, ts } = JSON.parse(raw) as { orderId: string; shortId: string; ts: number };
      // Only show if stored within the last 30 seconds
      if (Date.now() - ts < 30_000 && orderId === params.id) {
        toast.success(`Order #${shortId} placed successfully!`, {
          description: "Payment confirmed. Your order is now being processed.",
          duration: 7000,
        });
        sessionStorage.removeItem("orderSuccess");
      }
    } catch { /* ignore */ }
  }, [isNewOrder, params.id]);

  function copyOrderId() {
    if (!order) return;
    navigator.clipboard.writeText(order.id).then(() => {
      setCopied(true);
      toast.success("Order ID copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || json.message || "Failed to load order");
        }

        setOrder(json.data);
      } catch (err) {
        console.error("Failed to fetch order:", err);
        setError(err instanceof Error ? err.message : "Failed to load order");
      } finally {
        setLoading(false);
      }
    }

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg border border-red-200 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Package className="w-6 h-6 text-red-500" />
          </div>
          <h1 className="text-xl font-heading text-[#1A1A1A] mb-2">Order Not Found</h1>
          <p className="text-sm text-[#6B6B6B] mb-6">
            {error || "The order you're looking for doesn't exist or has been removed."}
          </p>
          <Link
            href="/pharmacy"
            className="inline-block px-6 py-2.5 bg-[#D4AF37] text-white font-medium rounded-md hover:bg-[#b8952e] transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    confirmed: "bg-blue-50 text-blue-700 border-blue-200",
    processing: "bg-purple-50 text-purple-700 border-purple-200",
    shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
    delivered: "bg-green-50 text-green-700 border-green-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };

  const paymentStatusColors: Record<string, string> = {
    unpaid: "text-red-600",
    paid: "text-green-600",
    refunded: "text-orange-600",
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-3xl font-heading text-[#1A1A1A] mb-2">Order Confirmed!</h1>
          <p className="text-sm text-[#6B6B6B]">
            Thank you for your order. We&apos;ve sent a confirmation to{" "}
            <span className="font-medium text-[#1A1A1A]">
              {order.isGuest ? order.guestEmail : order.customer?.email}
            </span>
          </p>
        </div>

        {/* Order ID — prominent display with copy */}
        <div className="bg-white rounded-lg border-2 border-[#D4AF37]/40 p-6 mb-6">
          <p className="text-xs text-[#6B6B6B] uppercase tracking-wider mb-2 text-center">Your Order ID</p>
          <div className="flex items-center justify-center gap-3">
            <p className="font-mono text-xl font-bold text-[#1A1A1A] tracking-wider break-all text-center">
              {order.id}
            </p>
            <button
              onClick={copyOrderId}
              title="Copy order ID"
              className="flex-shrink-0 p-2 rounded-md border border-[#E5E5E5] hover:border-[#D4AF37] hover:bg-[#FEF9EC] transition-colors"
            >
              {copied
                ? <Check className="w-4 h-4 text-green-500" />
                : <Copy className="w-4 h-4 text-[#6B6B6B]" />}
            </button>
          </div>
          <p className="text-xs text-[#6B6B6B] text-center mt-2">
            Save this ID to track your order later
          </p>
        </div>

        {/* Status & Date */}
        <div className="bg-white rounded-lg border border-[#E5E5E5] p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs text-[#6B6B6B] uppercase tracking-wider mb-1">Order Date</p>
              <p className="text-sm font-medium text-[#1A1A1A]">
                {new Date(order.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#6B6B6B] uppercase tracking-wider mb-1">Order Status</p>
              <span
                className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${
                  statusColors[order.orderStatus] || "bg-gray-50 text-gray-700 border-gray-200"
                }`}
              >
                {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
              </span>
            </div>
            <div>
              <p className="text-xs text-[#6B6B6B] uppercase tracking-wider mb-1">Payment</p>
              <span className={`text-sm font-semibold ${paymentStatusColors[order.paymentStatus] || "text-gray-600"}`}>
                {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg border border-[#E5E5E5] p-6 mb-6">
          <h2 className="text-lg font-heading text-[#1A1A1A] mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4 pb-4 border-b border-[#E5E5E5] last:border-0 last:pb-0">
                <div className="w-20 h-20 flex-shrink-0 bg-[#F9F9F9] rounded border border-[#E5E5E5] overflow-hidden">
                  <ProductImage
                    src={item.product?.productImage || ""}
                    alt={item.productName}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#1A1A1A] mb-1">{item.productName}</p>
                  <p className="text-sm text-[#6B6B6B]">Quantity: {item.quantity}</p>
                  <p className="text-sm font-semibold text-[#1A1A1A] mt-1">
                    £{Number(item.unitPrice).toFixed(2)} × {item.quantity} = £{Number(item.lineTotal).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary & Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Delivery Address */}
          <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="font-heading text-[#1A1A1A]">Delivery Address</h3>
            </div>
            <p className="text-sm text-[#374151] whitespace-pre-line">{order.deliveryAddress}</p>
            {order.deliveryNotes && (
              <div className="mt-3 pt-3 border-t border-[#E5E5E5]">
                <p className="text-xs text-[#6B6B6B] uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-[#374151]">{order.deliveryNotes}</p>
              </div>
            )}
          </div>

          {/* Payment & Total */}
          <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="font-heading text-[#1A1A1A]">Payment Details</h3>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-[#6B6B6B]">Method</span>
                <span className="font-medium text-[#1A1A1A] capitalize">{order.paymentMethod}</span>
              </div>
            </div>

            <div className="border-t border-[#E5E5E5] pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#6B6B6B]">Subtotal</span>
                <span className="font-medium text-[#1A1A1A]">£{Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B6B6B]">Tax</span>
                <span className="font-medium text-[#1A1A1A]">£{Number(order.taxAmount).toFixed(2)}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6B6B]">Discount</span>
                  <span className="font-medium text-green-600">-£{Number(order.discountAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-2 border-t border-[#E5E5E5]">
                <span className="text-[#1A1A1A]">Total</span>
                <span className="text-[#D4AF37]">£{Number(order.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/pharmacy"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-white font-semibold rounded-md hover:bg-[#b8952e] transition-colors"
          >
            <Home className="w-4 h-4" />
            Continue Shopping
          </Link>
          
          {order.isGuest ? (
            <Link
              href={`/track-order?orderId=${order.id}&email=${email || order.guestEmail || ""}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#1A1A1A] font-semibold rounded-md border border-[#E5E5E5] hover:border-[#D4AF37] transition-colors"
            >
              <Package className="w-4 h-4" />
              Track Order
            </Link>
          ) : (
            <Link
              href="/account/orders"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#1A1A1A] font-semibold rounded-md border border-[#E5E5E5] hover:border-[#D4AF37] transition-colors"
            >
              <Package className="w-4 h-4" />
              View My Orders
            </Link>
          )}
        </div>

        {/* Help Text */}
        <div className="text-center mt-8">
          <p className="text-sm text-[#6B6B6B]">
            Need help? Contact our support team at{" "}
            <a href="mailto:support@rosewood.com" className="text-[#D4AF37] hover:underline">
              support@rosewood.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
