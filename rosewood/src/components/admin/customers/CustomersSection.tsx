"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Users, Search, Filter, Eye, ToggleLeft, ToggleRight,
  Edit2, Check, X, ChevronLeft, ChevronRight, ShoppingBag,
  Mail, Phone, Calendar, TrendingUp, UserCheck, UserX, RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Customer = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type CustomerOrder = {
  id: string;
  orderStatus: string;
  paymentStatus: string;
  totalAmount: number | string;
  createdAt: string;
};

type CustomerDetail = Customer & {
  orderCount?: number;
  totalSpent?: number | string;
  orders?: CustomerOrder[];
  orderStats?: {
    total: number;
    delivered: number;
    pending: number;
    cancelled: number;
    totalSpent: number | string;
  };
};

type Stats = {
  total: number;
  active: number;
  inactive: number;
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

const PAGE_SIZE = 15;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | string) {
  return `£${Number(n).toFixed(2)}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-700",
  confirmed:  "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped:    "bg-indigo-100 text-indigo-700",
  delivered:  "bg-green-100 text-green-700",
  cancelled:  "bg-red-100 text-red-700",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CustomersSection() {
  // List state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      p.set("page", String(page));
      p.set("limit", String(PAGE_SIZE));
      if (search) p.set("search", search);
      if (activeFilter !== "") p.set("isActive", activeFilter);

      const res = await fetch(`/api/customers?${p}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to load customers");
      setCustomers(json.data || []);
      setPagination(json.pagination ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [page, search, activeFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/customers/stats");
      const json = await res.json();
      if (json.success) setStats(json.data);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ── Detail ─────────────────────────────────────────────────────────────────

  const openDetail = async (c: Customer) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/customers/${c.id}/orders`);
      const json = await res.json();
      if (json.success) setDetail(json.data ?? json.customer ?? c);
      else setDetail(c);
    } catch {
      setDetail(c);
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Toggle active ──────────────────────────────────────────────────────────

  const toggleActive = async (c: Customer) => {
    const action = c.isActive ? "deactivate" : "activate";
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} "${c.name}"?`)) return;

    try {
      const res = await fetch(`/api/customers/${c.id}/toggle-active`, { method: "PATCH" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed");
      toast.success(`Customer ${action}d`);
      fetchCustomers();
      fetchStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────

  const openEdit = (c: Customer) => {
    setEditTarget(c);
    setEditName(c.name);
    setEditEmail(c.email);
    setEditOpen(true);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/customers/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), email: editEmail.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to update");
      toast.success("Customer updated");
      setEditOpen(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setEditSaving(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 bg-[#F9F9F9] min-h-screen">
      <div className="max-w-full mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <h1 className="text-2xl font-heading text-[#1A1A1A]">Customers</h1>
              <p className="text-xs text-[#6B6B6B]">Manage registered customer accounts</p>
            </div>
          </div>
          <button
            onClick={() => { fetchCustomers(); fetchStats(); }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#6B6B6B] border border-[#E5E5E5] rounded-md hover:bg-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-[#E5E5E5] p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B] uppercase tracking-wider">Total</p>
                <p className="text-2xl font-heading text-[#1A1A1A]">{stats?.total ?? "—"}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-[#E5E5E5] p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B] uppercase tracking-wider">Active</p>
                <p className="text-2xl font-heading text-green-600">{stats?.active ?? "—"}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-[#E5E5E5] p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                <UserX className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B] uppercase tracking-wider">Inactive</p>
                <p className="text-2xl font-heading text-red-500">{stats?.inactive ?? "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[220px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-[#E5E5E5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#9CA3AF]" />
            <select
              value={activeFilter}
              onChange={e => { setActiveFilter(e.target.value as typeof activeFilter); setPage(1); }}
              className="text-sm border border-[#E5E5E5] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white"
            >
              <option value="">All customers</option>
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
            </select>
          </div>
          {(search || activeFilter) && (
            <button
              onClick={() => { setSearch(""); setActiveFilter(""); setPage(1); }}
              className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg border border-[#E5E5E5] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#F9F9F9] border-b border-[#E5E5E5]">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A]">Customer</th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] hidden md:table-cell">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] hidden lg:table-cell">Joined</th>
                    <th className="px-4 py-3 text-center font-medium text-[#1A1A1A]">Status</th>
                    <th className="px-4 py-3 text-center font-medium text-[#1A1A1A]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-[#6B6B6B]">
                        No customers found.
                      </td>
                    </tr>
                  ) : (
                    customers.map(c => (
                      <tr key={c.id} className="border-b border-[#E5E5E5] hover:bg-[#F9F9F9]/60 transition-colors">
                        {/* Avatar + Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                              style={{ backgroundColor: c.isActive ? "#D4AF37" : "#9CA3AF" }}>
                              {initials(c.name)}
                            </div>
                            <div>
                              <p className="font-medium text-[#1A1A1A]">{c.name || "—"}</p>
                              <p className="text-xs text-[#6B6B6B] md:hidden">{c.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* Email */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex items-center gap-2 text-[#374151]">
                            <Mail className="w-3.5 h-3.5 text-[#9CA3AF] flex-shrink-0" />
                            {c.email}
                          </div>
                        </td>
                        {/* Joined */}
                        <td className="px-4 py-3 hidden lg:table-cell text-[#6B6B6B] text-xs">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {fmtDate(c.createdAt)}
                          </div>
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${
                            c.isActive
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-red-50 text-red-600 border border-red-200"
                          }`}>
                            {c.isActive
                              ? <><Check className="w-3 h-3" /> Active</>
                              : <><X className="w-3 h-3" /> Inactive</>
                            }
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openDetail(c)}
                              title="View profile & orders"
                              className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEdit(c)}
                              title="Edit customer"
                              className="p-1.5 rounded-md hover:bg-[#D4AF37]/10 text-[#D4AF37] transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleActive(c)}
                              title={c.isActive ? "Deactivate" : "Activate"}
                              className={`p-1.5 rounded-md transition-colors ${
                                c.isActive
                                  ? "hover:bg-red-50 text-red-500"
                                  : "hover:bg-green-50 text-green-600"
                              }`}
                            >
                              {c.isActive
                                ? <ToggleLeft className="w-4 h-4" />
                                : <ToggleRight className="w-4 h-4" />
                              }
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-4 text-sm text-[#6B6B6B]">
                <span>
                  {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrev}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-[#E5E5E5] disabled:opacity-40 hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <span className="px-3 py-1.5 bg-white border border-[#D4AF37] rounded-md text-[#1A1A1A] font-medium">
                    {pagination.page} / {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                    disabled={!pagination.hasNext}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-[#E5E5E5] disabled:opacity-40 hover:bg-white transition-colors"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Detail Modal ──────────────────────────────────────────────────── */}
      {detailOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetailOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[#E5E5E5]">
              <h2 className="text-xl font-heading text-[#1A1A1A]">Customer Profile</h2>
              <button onClick={() => setDetailOpen(false)} className="p-1 rounded-md hover:bg-[#F9F9F9] text-[#6B6B6B]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : detail && (
              <div className="p-6 space-y-6">
                {/* Profile */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: detail.isActive ? "#D4AF37" : "#9CA3AF" }}>
                    {initials(detail.name)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-heading text-[#1A1A1A]">{detail.name}</h3>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        detail.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                      }`}>
                        {detail.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-[#6B6B6B]">
                      <Mail className="w-3.5 h-3.5" /> {detail.email}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF] mt-1">
                      <Calendar className="w-3.5 h-3.5" /> Joined {fmtDate(detail.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Order stats */}
                {detail.orderStats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Total Orders", value: detail.orderStats.total, icon: ShoppingBag, color: "text-blue-600 bg-blue-50" },
                      { label: "Delivered", value: detail.orderStats.delivered, icon: Check, color: "text-green-600 bg-green-50" },
                      { label: "Pending", value: detail.orderStats.pending, icon: TrendingUp, color: "text-yellow-600 bg-yellow-50" },
                      { label: "Total Spent", value: fmt(detail.orderStats.totalSpent ?? 0), icon: TrendingUp, color: "text-[#D4AF37] bg-[#D4AF37]/10", isString: true },
                    ].map(s => (
                      <div key={s.label} className="bg-[#F9F9F9] rounded-lg p-3 text-center">
                        <p className="text-xs text-[#6B6B6B] uppercase tracking-wider mb-1">{s.label}</p>
                        <p className={`text-xl font-heading ${s.color.split(" ")[0]}`}>
                          {s.isString ? s.value : s.value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recent orders */}
                {detail.orders && detail.orders.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wider mb-3">Recent Orders</h4>
                    <div className="space-y-2">
                      {detail.orders.slice(0, 5).map(o => (
                        <div key={o.id} className="flex items-center justify-between p-3 bg-[#F9F9F9] rounded-lg border border-[#E5E5E5]">
                          <div>
                            <p className="text-sm font-mono font-medium text-[#1A1A1A]">#{o.id.slice(0, 8)}</p>
                            <p className="text-xs text-[#6B6B6B]">{fmtDate(o.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${ORDER_STATUS_COLORS[o.orderStatus] || "bg-gray-100 text-gray-600"}`}>
                              {o.orderStatus}
                            </span>
                            <span className="text-sm font-semibold text-[#1A1A1A]">{fmt(o.totalAmount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!detail.orders || detail.orders.length === 0) && (
                  <div className="text-center py-6 text-[#9CA3AF]">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No orders yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Edit Modal ────────────────────────────────────────────────────── */}
      {editOpen && editTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[#E5E5E5]">
              <h2 className="text-xl font-heading text-[#1A1A1A]">Edit Customer</h2>
              <button onClick={() => setEditOpen(false)} className="p-1 rounded-md hover:bg-[#F9F9F9] text-[#6B6B6B]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="px-4 py-2 text-sm border border-[#E5E5E5] rounded-md hover:bg-[#F9F9F9] text-[#1A1A1A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-4 py-2 text-sm bg-[#D4AF37] text-white rounded-md hover:bg-[#b8952e] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
