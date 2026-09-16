"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import ProductImage from "@/components/ui/ProductImage";

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product?: {
    productImage: string | null;
  };
}

interface Order {
  id: string;
  orderStatus: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

interface CustomerOrdersClientProps {
  customerId: string;
}

export default function CustomerOrdersClient({ customerId }: CustomerOrdersClientProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch(`/api/orders/customer/${customerId}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || json.message || "Failed to load orders");
        }

        setOrders(json.data || []);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setError(err instanceof Error ? err.message : "Failed to load orders");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [customerId]);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    confirmed: "bg-blue-50 text-blue-700 border-blue-200",
    processing: "bg-purple-50 text-purple-700 border-purple-200",
    shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
    delivered: "bg-green-50 text-green-700 border-green-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg border border-red-200 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-heading text-[#1A1A1A] mb-2">Error Loading Orders</h2>
          <p className="text-sm text-[#6B6B6B]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <header className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/" className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] mb-2 inline-block">
            ← Back to Home
          </Link>
          <h1 className="font-heading text-2xl text-[#1A1A1A]">My Orders</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#E5E5E5] p-12 text-center">
            <Package className="w-16 h-16 text-[#E5E5E5] mx-auto mb-4" />
            <h2 className="text-xl font-heading text-[#1A1A1A] mb-2">No Orders Yet</h2>
            <p className="text-sm text-[#6B6B6B] mb-6">
              You haven't placed any orders yet. Start shopping to see your orders here.
            </p>
            <Link
              href="/pharmacy"
              className="inline-block px-6 py-2.5 bg-[#D4AF37] text-white font-semibold rounded-md hover:bg-[#b8952e] transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg border border-[#E5E5E5] overflow-hidden">
                {/* Order Header */}
                <div className="p-4 bg-[#F9F9F9] border-b border-[#E5E5E5]">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-[#6B6B6B] uppercase tracking-wider">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-[#374151] mt-1">
                        Placed on {new Date(order.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                          statusColors[order.orderStatus] || "bg-gray-50 text-gray-700 border-gray-200"
                        }`}
                      >
                        {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                      </span>
                      <span className="text-lg font-heading text-[#1A1A1A]">
                        £{Number(order.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4">
                  <div className="space-y-3">
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="w-16 h-16 flex-shrink-0 bg-[#F9F9F9] rounded border border-[#E5E5E5] overflow-hidden">
                          <ProductImage
                            src={item.product?.productImage || ""}
                            alt={item.productName}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1A1A1A] line-clamp-1">{item.productName}</p>
                          <p className="text-xs text-[#6B6B6B] mt-0.5">Qty: {item.quantity}</p>
                          <p className="text-sm font-semibold text-[#1A1A1A] mt-1">
                            £{Number(item.lineTotal).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-xs text-[#6B6B6B] text-center pt-2">
                        +{order.items.length - 3} more item{order.items.length - 3 !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>

                {/* Order Footer */}
                <div className="p-4 bg-[#F9F9F9] border-t border-[#E5E5E5] flex justify-end">
                  <Link
                    href={`/order-confirmation/${order.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#1A1A1A] border border-[#E5E5E5] rounded-md hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
                  >
                    View Details
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
