/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = {
  id: string;
  categoryName: string;
  categoryDescription: string | null;
  parentId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subCategories?: Category[];
  parentCategory?: Category | null;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    total: number; page: number; limit: number;
    pages: number; hasNext: boolean; hasPrev: boolean;
  };
  summary?: { total: number; created: number; skipped: number; invalidRows: number };
  skippedNames?: string[];
};

const API_BASE = "/api/product-categories";
const PAGE_SIZE = 10;

// ─── Export helper ────────────────────────────────────────────────────────────

function exportToCSV(categories: Category[]) {
  const headers = ["id", "categoryName", "categoryDescription", "parentId", "parentName", "isActive", "createdAt", "updatedAt"];
  const rows = categories.map((c) => [
    c.id,
    c.categoryName,
    c.categoryDescription || "",
    c.parentId || "",
    c.parentCategory?.categoryName || "",
    String(c.isActive),
    c.createdAt ? new Date(c.createdAt).toLocaleString() : "",
    c.updatedAt ? new Date(c.updatedAt).toLocaleString() : "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  link.download = `categories-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductCategoriesSection() {
  const [categories, setCategories]     = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [pagination, setPagination]     = useState<ApiResponse<any>["pagination"]>(undefined);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage]   = useState(1);
  const [copiedId, setCopiedId]         = useState<string | null>(null);

  // Create / Edit modal
  const [modalOpen, setModalOpen]               = useState(false);
  const [editingCategory, setEditingCategory]   = useState<Category | null>(null);
  const [formData, setFormData]                 = useState({ categoryName: "", categoryDescription: "", parentId: "", isActive: true });
  const [submitting, setSubmitting]             = useState(false);

  // Bulk import modal
  const [bulkModalOpen, setBulkModalOpen]       = useState(false);
  const [bulkFile, setBulkFile]                 = useState<File | null>(null);
  const [bulkJson, setBulkJson]                 = useState("");
  const [bulkSubmitting, setBulkSubmitting]     = useState(false);
  const [bulkResult, setBulkResult]             = useState<ApiResponse<any> | null>(null);

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      p.set("page", String(currentPage));
      p.set("limit", String(PAGE_SIZE));
      if (search) p.set("search", search);
      if (activeFilter !== undefined) p.set("isActive", String(activeFilter));

      const res  = await fetch(`${API_BASE}?${p}`);
      const json: ApiResponse<Category[]> = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to fetch");
      setCategories(json.data || []);
      setPagination(json.pagination ?? undefined);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, activeFilter]);

  const fetchAllCategories = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}?limit=500`);
      const json: ApiResponse<Category[]> = await res.json();
      if (json.success) setAllCategories(json.data || []);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { fetchCategories(); fetchAllCategories(); }, [fetchCategories, fetchAllCategories]);

  // ─── Copy ID to clipboard ────────────────────────────────────────────────────

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      toast.success("Category ID copied");
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // ─── Modal helpers ───────────────────────────────────────────────────────────

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ categoryName: "", categoryDescription: "", parentId: "", isActive: true });
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      categoryName: cat.categoryName,
      categoryDescription: cat.categoryDescription || "",
      parentId: cat.parentId || "",
      isActive: cat.isActive,
    });
    setModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value }));
  };

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isEdit = !!editingCategory;
      const res = await fetch(isEdit ? `${API_BASE}/${editingCategory.id}` : API_BASE, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryName:        formData.categoryName.trim(),
          categoryDescription: formData.categoryDescription.trim() || undefined,
          parentId:            formData.parentId || null,
          isActive:            formData.isActive,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Operation failed");
      toast.success(isEdit ? "Category updated" : "Category created");
      await fetchCategories();
      await fetchAllCategories();
      setModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const res  = await fetch(`${API_BASE}/${id}/toggle-active`, { method: "PATCH" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Toggle failed");
      toast.success(json.message || "Status toggled");
      await fetchCategories();
      await fetchAllCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Toggle failed");
    }
  };

  // ─── Bulk import ─────────────────────────────────────────────────────────────

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkSubmitting(true);
    setBulkResult(null);
    try {
      let body: FormData | string;
      let headers: HeadersInit = {};
      if (bulkFile) {
        const fd = new FormData();
        fd.append("file", bulkFile);
        body = fd;
      } else if (bulkJson.trim()) {
        const parsed = JSON.parse(bulkJson);
        if (!Array.isArray(parsed)) throw new Error("JSON must be an array");
        body    = JSON.stringify(parsed);
        headers = { "Content-Type": "application/json" };
      } else {
        throw new Error("Please provide a file or JSON array.");
      }
      const res  = await fetch(`${API_BASE}/bulk`, { method: "POST", headers, body });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Bulk import failed");
      setBulkResult(json);
      toast.success(`Imported ${json.summary?.created || 0} categories`);
      await fetchCategories();
      await fetchAllCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk import failed");
    } finally {
      setBulkSubmitting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 bg-[#F9F9F9] min-h-screen text-[#1A1A1A]">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-heading">Product Categories</h1>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => exportToCSV(allCategories.length ? allCategories : categories)}
              className="px-4 py-2 rounded-md border border-[#6B6B6B] text-[#6B6B6B] text-sm font-medium hover:bg-[#6B6B6B]/10 transition-colors">
              ↓ Export CSV
            </button>
            <button onClick={openCreateModal}
              className="px-4 py-2 rounded-md bg-[#D4AF37] text-white text-sm font-medium hover:bg-[#b8952e] transition-colors">
              + Add Category
            </button>
            <button onClick={() => { setBulkFile(null); setBulkJson(""); setBulkResult(null); setBulkModalOpen(true); }}
              className="px-4 py-2 rounded-md border border-[#D4AF37] text-[#D4AF37] text-sm font-medium hover:bg-[#D4AF37]/10 transition-colors">
              Bulk Import
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex-1 min-w-[200px]">
            <input type="text" placeholder="Search by name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            />
          </div>
          <select
            value={activeFilter === undefined ? "" : String(activeFilter)}
            onChange={(e) => { const v = e.target.value; setActiveFilter(v === "" ? undefined : v === "true"); setCurrentPage(1); }}
            className="rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value="">All status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button onClick={() => { setSearch(""); setActiveFilter(undefined); setCurrentPage(1); }}
            className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A]">
            Clear filters
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E5] overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: "1100px" }}>
                <thead className="bg-[#F9F9F9] border-b border-[#E5E5E5]">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-[#6B6B6B] whitespace-nowrap">Category ID</th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap">Description</th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap">Parent</th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap">Created At</th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap">Updated At</th>
                    <th className="px-4 py-3 text-right font-medium text-[#1A1A1A] whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-[#6B6B6B]">
                        No categories found.
                      </td>
                    </tr>
                  ) : categories.map((cat) => (
                    <tr key={cat.id} className="border-b border-[#E5E5E5] hover:bg-[#F9F9F9]/50">

                      {/* Category ID — truncated with copy button */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[#6B6B6B] truncate max-w-[120px]" title={cat.id}>
                            {cat.id.slice(0, 8)}…
                          </span>
                          <button
                            onClick={() => copyId(cat.id)}
                            title="Copy full ID"
                            className={`shrink-0 px-1.5 py-0.5 rounded text-xs border transition-colors ${
                              copiedId === cat.id
                                ? "bg-green-100 border-green-300 text-green-700"
                                : "border-[#E5E5E5] text-[#6B6B6B] hover:border-[#D4AF37] hover:text-[#D4AF37]"
                            }`}
                          >
                            {copiedId === cat.id ? "✓" : "copy"}
                          </button>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{cat.categoryName}</td>

                      {/* Description */}
                      <td className="px-4 py-3 text-[#6B6B6B] max-w-xs truncate">
                        {cat.categoryDescription || "—"}
                      </td>

                      {/* Parent */}
                      <td className="px-4 py-3 text-[#6B6B6B] whitespace-nowrap">
                        {cat.parentCategory?.categoryName || "—"}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          cat.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                        }`}>
                          {cat.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="px-4 py-3 text-[#6B6B6B] whitespace-nowrap text-xs">
                        {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </td>

                      {/* Updated At */}
                      <td className="px-4 py-3 text-[#6B6B6B] whitespace-nowrap text-xs">
                        {cat.updatedAt ? new Date(cat.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex justify-end items-center gap-2">
                          <button onClick={() => handleToggleActive(cat.id)}
                            title={cat.isActive ? "Deactivate" : "Activate"}
                            className={`p-1 rounded hover:bg-[#F0F0F0] text-sm ${cat.isActive ? "text-[#D4AF37]" : "text-[#6B6B6B]"}`}>
                            {cat.isActive ? "✓" : "✕"}
                          </button>
                          <button onClick={() => openEditModal(cat)} title="Edit"
                            className="p-1 rounded hover:bg-[#F0F0F0] text-[#1A1A1A] text-sm">
                            ✎
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex justify-between items-center mt-4 text-sm text-[#6B6B6B]">
                <span>
                  Showing {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrev}
                    className="px-3 py-1 rounded border border-[#E5E5E5] disabled:opacity-50 hover:bg-[#F9F9F9]">
                    Previous
                  </button>
                  <button onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={!pagination.hasNext}
                    className="px-3 py-1 rounded border border-[#E5E5E5] disabled:opacity-50 hover:bg-[#F9F9F9]">
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══════════════════ CREATE / EDIT MODAL ════════════════════════════ */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">

            {/* Show ID when editing */}
            {editingCategory && (
              <div className="mb-4 p-3 bg-[#F9F9F9] rounded-md border border-[#E5E5E5]">
                <p className="text-xs font-medium text-[#6B6B6B] mb-1">Category ID</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#1A1A1A] break-all flex-1">{editingCategory.id}</span>
                  <button
                    type="button"
                    onClick={() => copyId(editingCategory.id)}
                    className={`shrink-0 px-2 py-1 rounded text-xs border transition-colors ${
                      copiedId === editingCategory.id
                        ? "bg-green-100 border-green-300 text-green-700"
                        : "border-[#E5E5E5] text-[#6B6B6B] hover:border-[#D4AF37] hover:text-[#D4AF37]"
                    }`}
                  >
                    {copiedId === editingCategory.id ? "✓ Copied" : "Copy"}
                  </button>
                </div>
              </div>
            )}

            <h2 className="text-xl font-heading mb-4">
              {editingCategory ? "Edit Category" : "Add New Category"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="categoryName" className="block text-sm font-medium">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input id="categoryName" name="categoryName" type="text"
                  value={formData.categoryName} onChange={handleFormChange} required
                  placeholder="e.g. Pain Relief"
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label htmlFor="categoryDescription" className="block text-sm font-medium">
                  Description (optional)
                </label>
                <textarea id="categoryDescription" name="categoryDescription" rows={2}
                  value={formData.categoryDescription} onChange={handleFormChange}
                  placeholder="Brief description"
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label htmlFor="parentId" className="block text-sm font-medium">
                  Parent Category (optional)
                </label>
                <select id="parentId" name="parentId"
                  value={formData.parentId} onChange={handleFormChange}
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  <option value="">None (top-level)</option>
                  {allCategories
                    .filter((c) => c.id !== editingCategory?.id)
                    .map((c) => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input id="isActive" name="isActive" type="checkbox"
                  checked={formData.isActive} onChange={handleFormChange}
                  className="w-4 h-4 text-[#D4AF37] border-[#E5E5E5] rounded focus:ring-[#D4AF37]"
                />
                <label htmlFor="isActive" className="text-sm">Active (visible in store)</label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-md border border-[#E5E5E5] text-sm font-medium hover:bg-[#F9F9F9]">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="px-4 py-2 rounded-md bg-[#D4AF37] text-white text-sm font-medium hover:bg-[#b8952e] disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? "Saving..." : editingCategory ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════ BULK IMPORT MODAL ══════════════════════════════ */}
      {bulkModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-heading mb-3">Bulk Import Categories</h2>

            <p className="text-sm text-[#6B6B6B] mb-1">ChatGPT prompt:</p>
            <div className="bg-[#F9F9F9] border border-[#E5E5E5] rounded-md p-3 mb-4 text-xs font-mono text-[#1A1A1A] leading-relaxed select-all">
              Give me a list of 20 UK pharmacy product categories as an Excel table with exactly these column headers: categoryName, categoryDescription, parentName. Leave parentName blank for top-level categories. Fill parentName only for subcategories (e.g. Moisturizers has parentName Skincare). Output as a downloadable Excel file.
            </div>

            <p className="text-sm text-[#6B6B6B] mb-4">
              Required: <strong>categoryName</strong> · Optional: <strong>categoryDescription</strong>, <strong>parentName</strong>
            </p>

            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Upload Excel (.xlsx / .xls)</label>
                <input type="file" accept=".xlsx,.xls"
                  onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-[#6B6B6B] file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-[#D4AF37] file:text-white hover:file:bg-[#b8952e]"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E5E5E5]" /></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-[#6B6B6B]">OR</span></div>
              </div>

              <div>
                <label htmlFor="bulkJson" className="block text-sm font-medium mb-1">Paste JSON Array</label>
                <textarea id="bulkJson" rows={5} value={bulkJson}
                  onChange={(e) => setBulkJson(e.target.value)}
                  placeholder='[{"categoryName":"Pain Relief","categoryDescription":"Analgesics and anti-inflammatory","parentName":""},{"categoryName":"Paracetamol","categoryDescription":"Paracetamol-based products","parentName":"Pain Relief"}]'
                  className="w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              {bulkResult && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm">
                  <p className="font-medium text-green-800">Import completed</p>
                  <ul className="mt-1 text-green-700 space-y-1">
                    <li>Total: {bulkResult.summary?.total}</li>
                    <li>Created: {bulkResult.summary?.created}</li>
                    <li>Skipped (duplicates): {bulkResult.summary?.skipped}</li>
                    <li>Invalid rows: {bulkResult.summary?.invalidRows}</li>
                    {bulkResult.skippedNames && bulkResult.skippedNames.length > 0 && (
                      <li>Skipped: {bulkResult.skippedNames.join(", ")}</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setBulkModalOpen(false); setBulkResult(null); }}
                  className="px-4 py-2 rounded-md border border-[#E5E5E5] text-sm font-medium hover:bg-[#F9F9F9]">
                  Close
                </button>
                <button type="submit" disabled={bulkSubmitting}
                  className="px-4 py-2 rounded-md bg-[#D4AF37] text-white text-sm font-medium hover:bg-[#b8952e] disabled:opacity-50 disabled:cursor-not-allowed">
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
