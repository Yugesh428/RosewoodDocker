"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Order {
  id: string;
  customerId: string | null;
  isGuest: boolean;
  guestName: string | null;
  orderStatus: string;
  totalAmount: number;
  createdAt: string;
  customer?: {
    name: string;
    email: string;
  };
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  processing: "bg-purple-100 text-purple-800 border-purple-200",
  shipped: "bg-indigo-100 text-indigo-800 border-indigo-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

export default function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders?page=1&limit=5");
        const data = await res.json();
        if (data.success) {
          setOrders(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <Card className="p-6 border border-gray-200">
        <h3 className="text-base font-heading text-gray-900 mb-4">Recent Orders</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-heading text-gray-900">Recent Orders</h3>
        <a 
          href="/admin/orders" 
          className="text-xs text-[#D4AF37] hover:underline font-sans uppercase tracking-wide"
        >
          View All
        </a>
      </div>

      <div className="space-y-3">
        {orders.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No orders yet</p>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-12 gap-3 px-3 pb-2 border-b border-gray-200">
              <div className="col-span-3 text-[10px] uppercase tracking-wide text-gray-500 font-sans">
                Order ID
              </div>
              <div className="col-span-3 text-[10px] uppercase tracking-wide text-gray-500 font-sans">
                Customer
              </div>
              <div className="col-span-2 text-[10px] uppercase tracking-wide text-gray-500 font-sans text-right">
                Amount
              </div>
              <div className="col-span-2 text-[10px] uppercase tracking-wide text-gray-500 font-sans">
                Status
              </div>
              <div className="col-span-2 text-[10px] uppercase tracking-wide text-gray-500 font-sans text-right">
                Date
              </div>
            </div>

            {/* Rows */}
            {orders.map((order) => (
              <div 
                key={order.id}
                className="grid grid-cols-12 gap-3 px-3 py-2 hover:bg-gray-50 rounded transition-colors cursor-pointer"
                onClick={() => window.location.href = `/admin/orders/${order.id}`}
              >
                <div className="col-span-3 text-sm font-mono text-[#D4AF37] truncate">
                  #{order.id.slice(0, 8).toUpperCase()}
                </div>
                <div className="col-span-3 text-sm text-gray-900 truncate">
                  {order.isGuest ? order.guestName : order.customer?.name || "Unknown"}
                </div>
                <div className="col-span-2 text-sm text-gray-900 font-medium text-right">
                  ${Number(order.totalAmount).toFixed(2)}
                </div>
                <div className="col-span-2">
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] uppercase ${statusColors[order.orderStatus] || "bg-gray-100"}`}
                  >
                    {order.orderStatus}
                  </Badge>
                </div>
                <div className="col-span-2 text-xs text-gray-500 text-right">
                  {new Date(order.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
