/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

type PaymentStatus = "unpaid" | "paid" | "refunded";
type PaymentMethod = "cash" | "card" | "online" | "upi";

type OrderItem = {
  id: string;
  productId: string;
  orderId: string;
  inventoryId: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
  taxAmount: number;
  discountAmount: number;
  lineTotal: number;
  productName: string;
  batchNumber: string;
  product?: {
    id: string;
    productName: string;
    productImage: string | null;
    dosageForm?: string;
    strength?: string;
  };
};

type Customer = {
  id: string;
  name: string;
  email: string;
};

type Order = {
  id: string;
  customerId: string | null;
  isGuest: boolean;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  deliveryAddress: string;
  deliveryNotes: string | null;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer | null;
  items?: OrderItem[];
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

type StatsResponse = {
  success: boolean;
  data: {
    total: number;
    byStatus: Record<OrderStatus, number>;
    revenue: {
      total: number;
      avgOrder: number;
    };
  };
};

const API_BASE = "/api/orders";
const PAGE_SIZE = 10;

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const PAYMENT_STATUSES: PaymentStatus[] = ["unpaid", "paid", "refunded"];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  unpaid: "bg-gray-100 text-gray-600",
  paid: "bg-green-100 text-green-800",
  refunded: "bg-orange-100 text-orange-800",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrdersSection() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] =
    useState<ApiResponse<any>["pagination"]>(undefined);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Stats
  const [stats, setStats] = useState<StatsResponse["data"] | null>(null);

  // Modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Status update modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>("pending");
  const [cancellationReason, setCancellationReason] = useState("");
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // Payment update modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<Order | null>(null);
  const [newPaymentStatus, setNewPaymentStatus] =
    useState<PaymentStatus>("unpaid");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // ─── Fetch orders ─────────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(PAGE_SIZE));
      if (search) params.set("search", search);
      if (statusFilter) params.set("orderStatus", statusFilter);
      if (paymentFilter) params.set("paymentStatus", paymentFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`${API_BASE}?${params.toString()}`);
      const json: ApiResponse<Order[]> = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message || "Failed to fetch orders");
      setOrders(json.data || []);
      setPagination(json.pagination ?? undefined);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter, paymentFilter, dateFrom, dateTo]);

  // ─── Fetch stats ─────────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const res = await fetch(`${API_BASE}/stats?${params.toString()}`);
      const json: StatsResponse = await res.json();
      if (json.success) setStats(json.data);
    } catch (err) {
      // non-critical
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [fetchOrders, fetchStats]);

  // ─── View order details ─────────────────────────────────────────────────────

  const openDetailModal = async (order: Order) => {
    // Fetch full details with items
    try {
      const res = await fetch(`${API_BASE}/${order.id}`);
      const json: ApiResponse<Order> = await res.json();
      if (json.success) {
        setSelectedOrder(json.data || null);
        setDetailModalOpen(true);
      }
    } catch (err) {
      toast.error("Failed to load order details");
    }
  };

  // ─── Update order status ────────────────────────────────────────────────────

  const openStatusModal = (order: Order) => {
    setStatusTarget(order);
    setNewStatus(order.orderStatus);
    setCancellationReason(order.cancellationReason || "");
    setStatusModalOpen(true);
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTarget) return;
    if (newStatus === statusTarget.orderStatus) {
      toast.info("No change in status");
      setStatusModalOpen(false);
      return;
    }

    setStatusSubmitting(true);
    try {
      const payload: { status: OrderStatus; cancellationReason?: string } = {
        status: newStatus,
      };
      if (newStatus === "cancelled" && cancellationReason.trim()) {
        payload.cancellationReason = cancellationReason.trim();
      }

      const res = await fetch(`${API_BASE}/${statusTarget.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message || "Status update failed");

      toast.success(json.message || `Order status updated to "${newStatus}"`);
      setStatusModalOpen(false);
      await fetchOrders();
      await fetchStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setStatusSubmitting(false);
    }
  };

  // ─── Update payment status ──────────────────────────────────────────────────

  const openPaymentModal = (order: Order) => {
    setPaymentTarget(order);
    setNewPaymentStatus(order.paymentStatus);
    setPaymentModalOpen(true);
  };

  const handlePaymentUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTarget) return;
    if (newPaymentStatus === paymentTarget.paymentStatus) {
      toast.info("No change in payment status");
      setPaymentModalOpen(false);
      return;
    }

    setPaymentSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/${paymentTarget.id}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: newPaymentStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message || "Payment update failed");

      toast.success(
        json.message || `Payment status updated to "${newPaymentStatus}"`,
      );
      setPaymentModalOpen(false);
      await fetchOrders();
      await fetchStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment update failed");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCustomerDisplay = (order: Order) => {
    if (order.isGuest) {
      return `${order.guestName || "Guest"} (Guest)`;
    }
    return order.customer?.name || "Unknown";
  };

  const getCustomerEmail = (order: Order) => {
    if (order.isGuest) return order.guestEmail || "—";
    return order.customer?.email || "—";
  };

  const canTransition = (order: Order, status: OrderStatus) => {
    const allowed: Record<OrderStatus, OrderStatus[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered", "cancelled"],
      delivered: [],
      cancelled: [],
    };
    return allowed[order.orderStatus]?.includes(status) ?? false;
  };

  const getAvailableStatuses = (order: Order) => {
    return ORDER_STATUSES.filter((s) => canTransition(order, s));
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 bg-[#F9F9F9] min-h-screen text-[#1A1A1A]">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-heading text-[#1A1A1A]">Orders</h1>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <StatCard label="Total" value={stats.total} />
            <StatCard
              label="Pending"
              value={stats.byStatus.pending}
              color="bg-yellow-100 text-yellow-800"
            />
            <StatCard
              label="Confirmed"
              value={stats.byStatus.confirmed}
              color="bg-blue-100 text-blue-800"
            />
            <StatCard
              label="Processing"
              value={stats.byStatus.processing}
              color="bg-purple-100 text-purple-800"
            />
            <StatCard
              label="Shipped"
              value={stats.byStatus.shipped}
              color="bg-indigo-100 text-indigo-800"
            />
            <StatCard
              label="Delivered"
              value={stats.byStatus.delivered}
              color="bg-green-100 text-green-800"
            />
          </div>
        )}

        {/* Revenue Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E5] p-4">
              <p className="text-xs text-[#6B6B6B] uppercase tracking-wider">
                Total Revenue
              </p>
              <p className="text-2xl font-heading text-[#1A1A1A]">
                {formatCurrency(stats.revenue.total)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E5] p-4">
              <p className="text-xs text-[#6B6B6B] uppercase tracking-wider">
                Average Order Value
              </p>
              <p className="text-2xl font-heading text-[#1A1A1A]">
                {formatCurrency(stats.revenue.avgOrder)}
              </p>
            </div>
          </div>
        )}

        {/* Search / filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex-1 min-w-[180px]">
            <input
              type="text"
              placeholder="Search by customer name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as OrderStatus | "")
            }
            className="rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value="">All status</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={paymentFilter}
            onChange={(e) =>
              setPaymentFilter(e.target.value as PaymentStatus | "")
            }
            className="rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value="">All payment</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
          <span className="text-[#6B6B6B]">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setPaymentFilter("");
              setDateFrom("");
              setDateTo("");
              setCurrentPage(1);
            }}
            className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A]"
          >
            Clear filters
          </button>
        </div>

        {/* Loading / Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E5] overflow-x-auto">
              <table className="w-full text-sm min-w-[1000px]">
                <thead className="bg-[#F9F9F9] border-b border-[#E5E5E5]">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap">
                      Order #
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap hidden md:table-cell">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap hidden lg:table-cell">
                      Payment
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-[#1A1A1A] whitespace-nowrap">
                      Total
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-[#1A1A1A] whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-[#6B6B6B]"
                      >
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-[#E5E5E5] hover:bg-[#F9F9F9]/50"
                      >
                        <td className="px-4 py-3 font-medium whitespace-nowrap">
                          #{order.id.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium">
                            {getCustomerDisplay(order)}
                          </div>
                          <div className="text-xs text-[#6B6B6B]">
                            {getCustomerEmail(order)}
                          </div>
                          {order.isGuest && (
                            <span className="text-xs text-[#D4AF37]">
                              Guest
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#6B6B6B] hidden md:table-cell whitespace-nowrap">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full ${STATUS_COLORS[order.orderStatus]}`}
                          >
                            {order.orderStatus.charAt(0).toUpperCase() +
                              order.orderStatus.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full ${PAYMENT_COLORS[order.paymentStatus]}`}
                          >
                            {order.paymentStatus.charAt(0).toUpperCase() +
                              order.paymentStatus.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex justify-center items-center gap-1">
                            <button
                              onClick={() => openDetailModal(order)}
                              className="p-1 rounded hover:bg-[#F9F9F9] text-[#1A1A1A]"
                              title="View details"
                            >
                              👁
                            </button>
                            <button
                              onClick={() => openStatusModal(order)}
                              className="p-1 rounded hover:bg-[#F9F9F9] text-blue-600"
                              title="Update status"
                            >
                              ⚡
                            </button>
                            <button
                              onClick={() => openPaymentModal(order)}
                              className="p-1 rounded hover:bg-[#F9F9F9] text-green-600"
                              title="Update payment"
                            >
                              💳
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex justify-between items-center mt-4 text-sm text-[#6B6B6B]">
                <span>
                  Showing {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}{" "}
                  of {pagination.total}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrev}
                    className="px-3 py-1 rounded border border-[#E5E5E5] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F9F9F9]"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(pagination.pages, p + 1))
                    }
                    disabled={!pagination.hasNext}
                    className="px-3 py-1 rounded border border-[#E5E5E5] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F9F9F9]"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Order Detail Modal ────────────────────────────────────────────── */}
      {detailModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-heading text-[#1A1A1A]">
                Order #{selectedOrder.id.slice(0, 8)}
              </h2>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="text-[#6B6B6B] hover:text-[#1A1A1A] text-xl"
              >
                ×
              </button>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-[#F9F9F9] rounded-md">
              <div>
                <p className="text-xs text-[#6B6B6B] uppercase tracking-wider">
                  Customer
                </p>
                <p className="font-medium">
                  {getCustomerDisplay(selectedOrder)}
                </p>
                <p className="text-sm text-[#6B6B6B]">
                  {getCustomerEmail(selectedOrder)}
                </p>
                {selectedOrder.isGuest && selectedOrder.guestPhone && (
                  <p className="text-sm text-[#6B6B6B]">
                    {selectedOrder.guestPhone}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B] uppercase tracking-wider">
                  Order Details
                </p>
                <p className="text-sm">
                  Status:{" "}
                  <span
                    className={`inline-block px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[selectedOrder.orderStatus]}`}
                  >
                    {selectedOrder.orderStatus.charAt(0).toUpperCase() +
                      selectedOrder.orderStatus.slice(1)}
                  </span>
                </p>
                <p className="text-sm">
                  Payment:{" "}
                  <span
                    className={`inline-block px-2 py-0.5 text-xs rounded-full ${PAYMENT_COLORS[selectedOrder.paymentStatus]}`}
                  >
                    {selectedOrder.paymentStatus.charAt(0).toUpperCase() +
                      selectedOrder.paymentStatus.slice(1)}
                  </span>
                </p>
                <p className="text-sm text-[#6B6B6B]">
                  Method: {selectedOrder.paymentMethod}
                </p>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="mb-4 p-4 bg-[#F9F9F9] rounded-md">
              <p className="text-xs text-[#6B6B6B] uppercase tracking-wider">
                Delivery Address
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {selectedOrder.deliveryAddress}
              </p>
              {selectedOrder.deliveryNotes && (
                <p className="text-sm text-[#6B6B6B] mt-1">
                  Notes: {selectedOrder.deliveryNotes}
                </p>
              )}
            </div>

            {/* Items */}
            <div className="mb-4">
              <p className="text-xs text-[#6B6B6B] uppercase tracking-wider mb-2">
                Items
              </p>
              <div className="border border-[#E5E5E5] rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[#F9F9F9]">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-[#1A1A1A]">
                        Product
                      </th>
                      <th className="px-3 py-2 text-center font-medium text-[#1A1A1A]">
                        Qty
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-[#1A1A1A]">
                        Price
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-[#1A1A1A]">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map((item) => (
                      <tr key={item.id} className="border-t border-[#E5E5E5]">
                        <td className="px-3 py-2">
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-xs text-[#6B6B6B]">
                            Batch: {item.batchNumber}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {formatCurrency(item.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#F9F9F9] border-t border-[#E5E5E5]">
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-2 text-right font-medium"
                      >
                        Subtotal
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatCurrency(selectedOrder.subtotal)}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-2 text-right text-sm text-[#6B6B6B]"
                      >
                        Tax
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-[#6B6B6B]">
                        {formatCurrency(selectedOrder.taxAmount)}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-2 text-right text-sm text-[#6B6B6B]"
                      >
                        Discount
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-[#6B6B6B]">
                        -{formatCurrency(selectedOrder.discountAmount)}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-2 text-right font-bold"
                      >
                        Total
                      </td>
                      <td className="px-3 py-2 text-right font-bold">
                        {formatCurrency(selectedOrder.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-[#6B6B6B]">
              <div>Created: {formatDate(selectedOrder.createdAt)}</div>
              {selectedOrder.confirmedAt && (
                <div>Confirmed: {formatDate(selectedOrder.confirmedAt)}</div>
              )}
              {selectedOrder.shippedAt && (
                <div>Shipped: {formatDate(selectedOrder.shippedAt)}</div>
              )}
              {selectedOrder.deliveredAt && (
                <div>Delivered: {formatDate(selectedOrder.deliveredAt)}</div>
              )}
              {selectedOrder.cancelledAt && (
                <div>Cancelled: {formatDate(selectedOrder.cancelledAt)}</div>
              )}
            </div>
            {selectedOrder.cancellationReason && (
              <div className="mt-2 text-sm text-red-600">
                Reason: {selectedOrder.cancellationReason}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4 pt-2">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 rounded-md border border-[#E5E5E5] text-sm font-medium text-[#1A1A1A] hover:bg-[#F9F9F9]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Status Update Modal ───────────────────────────────────────────── */}
      {statusModalOpen && statusTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-heading mb-2">Update Order Status</h2>
            <p className="text-sm text-[#6B6B6B] mb-4">
              Order #{statusTarget.id.slice(0, 8)} &nbsp;|&nbsp; Current:{" "}
              <span
                className={`inline-block px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[statusTarget.orderStatus]}`}
              >
                {statusTarget.orderStatus.charAt(0).toUpperCase() +
                  statusTarget.orderStatus.slice(1)}
              </span>
            </p>

            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  New Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                      {s === statusTarget.orderStatus ? " (current)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {newStatus === "cancelled" && (
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                    Cancellation Reason
                  </label>
                  <textarea
                    rows={3}
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    placeholder="Why is this order being cancelled?"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="px-4 py-2 rounded-md border border-[#E5E5E5] text-sm font-medium text-[#1A1A1A] hover:bg-[#F9F9F9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    statusSubmitting || newStatus === statusTarget.orderStatus
                  }
                  className="px-4 py-2 rounded-md bg-[#D4AF37] text-white text-sm font-medium hover:bg-[#b8952e] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {statusSubmitting ? "Updating..." : "Update Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Payment Update Modal ──────────────────────────────────────────── */}
      {paymentModalOpen && paymentTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-heading mb-2">Update Payment Status</h2>
            <p className="text-sm text-[#6B6B6B] mb-4">
              Order #{paymentTarget.id.slice(0, 8)} &nbsp;|&nbsp; Current:{" "}
              <span
                className={`inline-block px-2 py-0.5 text-xs rounded-full ${PAYMENT_COLORS[paymentTarget.paymentStatus]}`}
              >
                {paymentTarget.paymentStatus.charAt(0).toUpperCase() +
                  paymentTarget.paymentStatus.slice(1)}
              </span>
            </p>

            <form onSubmit={handlePaymentUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  Payment Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={newPaymentStatus}
                  onChange={(e) =>
                    setNewPaymentStatus(e.target.value as PaymentStatus)
                  }
                  className="w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-md border border-[#E5E5E5] text-sm font-medium text-[#1A1A1A] hover:bg-[#F9F9F9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    paymentSubmitting ||
                    newPaymentStatus === paymentTarget.paymentStatus
                  }
                  className="px-4 py-2 rounded-md bg-[#D4AF37] text-white text-sm font-medium hover:bg-[#b8952e] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {paymentSubmitting ? "Updating..." : "Update Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stat Card Component ─────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-[#E5E5E5] p-3 text-center`}
    >
      <p className="text-xs text-[#6B6B6B] uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-heading ${color || "text-[#1A1A1A]"}`}>
        {value}
      </p>
    </div>
  );
}
