/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable prefer-const */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

type StaffRole =
  | "pharmacist"
  | "cashier"
  | "store_manager"
  | "delivery"
  | "inventory_clerk"
  | "other";

type Staff = {
  id: string;
  fullName: string;
  employeeCode: string;
  role: StaffRole;
  phone: string;
  email: string | null;
  address: string | null;
  dateOfJoining: string; // ISO date
  salary: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
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
  summary?: {
    total: number;
    created: number;
    skipped: number;
    failed: number;
  };
  skippedCodes?: string[];
  errors?: { row: number; reason: string }[];
};

const API_BASE = "/api/staff";
const PAGE_SIZE = 10;
const ROLES: StaffRole[] = [
  "pharmacist",
  "cashier",
  "store_manager",
  "delivery",
  "inventory_clerk",
  "other",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function StaffSection() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [pagination, setPagination] =
    useState<ApiResponse<any>["pagination"]>(undefined);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
    undefined,
  );
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    employeeCode: "",
    role: "other" as StaffRole,
    phone: "",
    email: "",
    address: "",
    dateOfJoining: "",
    salary: 0,
    isActive: true,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Bulk import modal
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkJson, setBulkJson] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkResult, setBulkResult] = useState<ApiResponse<any> | null>(null);

  // ─── Fetch staff ─────────────────────────────────────────────────────────────

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(PAGE_SIZE));
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      if (activeFilter !== undefined)
        params.set("isActive", String(activeFilter));

      const res = await fetch(`${API_BASE}?${params.toString()}`);
      const json: ApiResponse<Staff[]> = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message || "Failed to fetch staff");
      setStaff(json.data || []);
      setPagination(json.pagination ?? undefined);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load staff");
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, roleFilter, activeFilter]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // ─── Modal helpers ──────────────────────────────────────────────────────────

  const openCreateModal = () => {
    setEditingStaff(null);
    setFormData({
      fullName: "",
      employeeCode: "",
      role: "other",
      phone: "",
      email: "",
      address: "",
      dateOfJoining: "",
      salary: 0,
      isActive: true,
      notes: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      fullName: staffMember.fullName,
      employeeCode: staffMember.employeeCode,
      role: staffMember.role,
      phone: staffMember.phone,
      email: staffMember.email || "",
      address: staffMember.address || "",
      dateOfJoining: staffMember.dateOfJoining.slice(0, 10), // YYYY-MM-DD
      salary: staffMember.salary,
      isActive: staffMember.isActive,
      notes: staffMember.notes || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingStaff(null);
  };

  // ─── Form handlers ──────────────────────────────────────────────────────────

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isEdit = !!editingStaff;
      const url = isEdit ? `${API_BASE}/${editingStaff.id}` : API_BASE;
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        fullName: formData.fullName.trim(),
        employeeCode: formData.employeeCode.trim(),
        role: formData.role,
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        dateOfJoining: formData.dateOfJoining,
        salary: Number(formData.salary),
        isActive: formData.isActive,
        notes: formData.notes.trim() || undefined,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message || "Operation failed");

      toast.success(isEdit ? "Staff updated" : "Staff created");
      await fetchStaff();
      closeModal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/${id}/toggle-active`, { method: "PATCH" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Toggle failed");
      toast.success(json.message || "Status toggled");
      await fetchStaff();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Toggle failed");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    toast.error(`Delete "${name}"?`, {
      description: "This action cannot be undone.",
      action: {
        label: "Yes, Delete",
        onClick: async () => {
          try {
            const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || "Delete failed");
            // Remove instantly from local state — no page refresh needed
            setStaff(prev => prev.filter(s => s.id !== id));
            toast.success(`"${name}" deleted`);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Delete failed");
            // Re-fetch to restore correct state on error
            fetchStaff();
          }
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
      actionButtonStyle: { backgroundColor: "#dc2626", color: "#fff" },
      cancelButtonStyle: { backgroundColor: "transparent", color: "#6b7280", border: "1px solid #e5e7eb" },
    });
  };

  // ─── Bulk import ────────────────────────────────────────────────────────────

  const openBulkModal = () => {
    setBulkFile(null);
    setBulkJson("");
    setBulkResult(null);
    setBulkModalOpen(true);
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkSubmitting(true);
    setBulkResult(null);

    try {
      let body: FormData | string;
      let headers: HeadersInit = {};
      const url = `${API_BASE}/bulk`;

      if (bulkFile) {
        const form = new FormData();
        form.append("file", bulkFile);
        body = form;
      } else if (bulkJson.trim()) {
        const parsed = JSON.parse(bulkJson);
        if (!Array.isArray(parsed)) throw new Error("JSON must be an array");
        body = JSON.stringify(parsed);
        headers["Content-Type"] = "application/json";
      } else {
        throw new Error("Please provide a file or JSON array.");
      }

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: body instanceof FormData ? body : body, // body is already a JSON string
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message || "Bulk import failed");

      setBulkResult(json);
      toast.success(`Imported ${json.summary?.created || 0} staff members`);
      await fetchStaff();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk import failed");
    } finally {
      setBulkSubmitting(false);
    }
  };

  // ─── Format date ────────────────────────────────────────────────────────────

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 bg-[#F9F9F9] min-h-screen text-[#1A1A1A]">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-heading text-[#1A1A1A]">
            Staff Management
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-md bg-[#D4AF37] text-white text-sm font-medium hover:bg-[#b8952e] transition-colors"
            >
              + Add Staff
            </button>
            <button
              onClick={openBulkModal}
              className="px-4 py-2 rounded-md border border-[#D4AF37] text-[#D4AF37] text-sm font-medium hover:bg-[#D4AF37]/10 transition-colors"
            >
              Bulk Import
            </button>
          </div>
        </div>

        {/* Search / filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name, code, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </option>
            ))}
          </select>
          <select
            value={activeFilter === undefined ? "" : String(activeFilter)}
            onChange={(e) => {
              const val = e.target.value;
              setActiveFilter(val === "" ? undefined : val === "true");
            }}
            className="rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value="">All status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button
            onClick={() => {
              setSearch("");
              setRoleFilter("");
              setActiveFilter(undefined);
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
              <table className="w-full text-sm min-w-[1200px]">
                <thead className="bg-[#F9F9F9] border-b border-[#E5E5E5]">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap hidden md:table-cell">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap hidden lg:table-cell">
                      Address
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap hidden xl:table-cell">
                      Joining
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap hidden xl:table-cell">
                      Salary
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-[#1A1A1A] whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {staff.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-8 text-center text-[#6B6B6B]"
                      >
                        No staff members found.
                      </td>
                    </tr>
                  ) : (
                    staff.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-[#E5E5E5] hover:bg-[#F9F9F9]/50"
                      >
                        <td className="px-4 py-3 font-medium whitespace-nowrap">
                          {s.fullName}
                        </td>
                        <td className="px-4 py-3 text-[#6B6B6B] whitespace-nowrap">
                          {s.employeeCode}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="capitalize">
                            {s.role.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {s.phone}
                        </td>
                        <td className="px-4 py-3 text-[#6B6B6B] hidden md:table-cell">
                          {s.email || "—"}
                        </td>
                        <td className="px-4 py-3 text-[#6B6B6B] hidden lg:table-cell max-w-[150px] truncate">
                          {s.address || "—"}
                        </td>
                        <td className="px-4 py-3 text-[#6B6B6B] hidden xl:table-cell whitespace-nowrap">
                          {formatDate(s.dateOfJoining)}
                        </td>
                        <td className="px-4 py-3 text-[#6B6B6B] hidden xl:table-cell whitespace-nowrap">
                          ${Number(s.salary).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full ${
                              s.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {s.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex justify-center items-center gap-2">
                            <button
                              onClick={() => handleToggleActive(s.id)}
                              className={`p-1 rounded hover:bg-[#F9F9F9] text-sm ${
                                s.isActive ? "text-[#D4AF37]" : "text-[#6B6B6B]"
                              }`}
                              title={s.isActive ? "Deactivate" : "Activate"}
                            >
                              {s.isActive ? "✓" : "✕"}
                            </button>
                            <button
                              onClick={() => openEditModal(s)}
                              className="p-1 rounded hover:bg-[#F9F9F9] text-[#1A1A1A]"
                              title="Edit"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => handleDelete(s.id, s.fullName)}
                              className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                              title="Delete permanently"
                            >
                              🗑
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

      {/* ─── Create / Edit Modal ────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-heading mb-4">
              {editingStaff ? "Edit Staff" : "Add New Staff"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* fullName */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleFormChange}
                  required
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              {/* employeeCode */}
              <div>
                <label
                  htmlFor="employeeCode"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Employee Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="employeeCode"
                  name="employeeCode"
                  type="text"
                  value={formData.employeeCode}
                  onChange={handleFormChange}
                  required
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  placeholder="EMP-001"
                />
              </div>

              {/* role */}
              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleFormChange}
                  required
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r
                        .replace("_", " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              {/* phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  value={formData.phone}
                  onChange={handleFormChange}
                  required
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              {/* email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Email (optional)
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              {/* address */}
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Address (optional)
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  placeholder="123 Main St, City"
                />
              </div>

              {/* dateOfJoining */}
              <div>
                <label
                  htmlFor="dateOfJoining"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Date of Joining <span className="text-red-500">*</span>
                </label>
                <input
                  id="dateOfJoining"
                  name="dateOfJoining"
                  type="date"
                  value={formData.dateOfJoining}
                  onChange={handleFormChange}
                  required
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                />
              </div>

              {/* salary */}
              <div>
                <label
                  htmlFor="salary"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Salary (optional)
                </label>
                <input
                  id="salary"
                  name="salary"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.salary}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* isActive */}
              <div className="flex items-center gap-2">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={handleFormChange}
                  className="w-4 h-4 text-[#D4AF37] focus:ring-[#D4AF37] border-[#E5E5E5] rounded"
                />
                <label htmlFor="isActive" className="text-sm text-[#1A1A1A]">
                  Active
                </label>
              </div>

              {/* notes */}
              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  placeholder="Any additional information..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-md border border-[#E5E5E5] text-sm font-medium text-[#1A1A1A] hover:bg-[#F9F9F9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-md bg-[#D4AF37] text-white text-sm font-medium hover:bg-[#b8952e] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? "Saving..."
                    : editingStaff
                      ? "Update"
                      : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Bulk Import Modal ────────────────────────────────────────────── */}
      {bulkModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-heading mb-4">Bulk Import Staff</h2>
            <p className="text-sm text-[#6B6B6B] mb-4">
              Upload an Excel file (.xlsx/.xls) with columns:{" "}
              <strong>fullName</strong> (required),
              <strong>employeeCode</strong> (required), <strong>role</strong>{" "}
              (pharmacist, cashier, etc.),
              <strong>phone</strong> (required), <strong>email</strong>,{" "}
              <strong>address</strong>,<strong>dateOfJoining</strong> (required,
              YYYY-MM-DD), <strong>salary</strong>,<strong>isActive</strong>{" "}
              (default true), <strong>notes</strong>.
              <br />
              Alternatively, paste a JSON array of staff objects below.
            </p>

            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A]">
                  Upload Excel File
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                  className="mt-1 w-full text-sm text-[#6B6B6B] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#D4AF37] file:text-white hover:file:bg-[#b8952e]"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E5E5E5]" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-[#6B6B6B]">OR</span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="bulkJson"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Paste JSON Array
                </label>
                <textarea
                  id="bulkJson"
                  rows={6}
                  value={bulkJson}
                  onChange={(e) => setBulkJson(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  placeholder='[{"fullName":"John Doe","employeeCode":"EMP-001","role":"pharmacist","phone":"+1 (555) 123-4567","dateOfJoining":"2024-01-01"}]'
                />
              </div>

              {bulkResult && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm">
                  <p className="font-medium text-green-800">Import completed</p>
                  <ul className="mt-1 text-green-700 space-y-1">
                    <li>Total rows: {bulkResult.summary?.total}</li>
                    <li>Created: {bulkResult.summary?.created}</li>
                    <li>
                      Skipped (duplicate codes): {bulkResult.summary?.skipped}
                    </li>
                    <li>Failed (validation): {bulkResult.summary?.failed}</li>
                    {bulkResult.skippedCodes &&
                      bulkResult.skippedCodes.length > 0 && (
                        <li>
                          Skipped codes: {bulkResult.skippedCodes.join(", ")}
                        </li>
                      )}
                    {bulkResult.errors && bulkResult.errors.length > 0 && (
                      <li>
                        Errors:
                        <ul className="list-disc list-inside ml-2">
                          {bulkResult.errors.map((e, i) => (
                            <li key={i}>
                              Row {e.row}: {e.reason}
                            </li>
                          ))}
                        </ul>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setBulkModalOpen(false);
                    setBulkResult(null);
                  }}
                  className="px-4 py-2 rounded-md border border-[#E5E5E5] text-sm font-medium text-[#1A1A1A] hover:bg-[#F9F9F9]"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={bulkSubmitting}
                  className="px-4 py-2 rounded-md bg-[#D4AF37] text-white text-sm font-medium hover:bg-[#b8952e] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkSubmitting ? "Importing..." : "Import"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
