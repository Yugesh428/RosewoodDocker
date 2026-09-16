"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { toast } from "sonner";

// Types based on the CollectionCategory model
type CollectionCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// API response shape
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

const API_BASE = "/api/ui/collection/categories";

export default function CollectionCategoriesSection() {
  const [categories, setCategories] = useState<CollectionCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtering / search (client‑side)
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);

  // Modal state for create / edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CollectionCategory | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    displayOrder: 0,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // ─── Fetch categories (admin: ?all=true) ──────────────────────────────────
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}?all=true`);
      const json: ApiResponse<CollectionCategory[]> = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to fetch categories");
      }
      setCategories(json.data || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ─── Helper: generate slug from name ──────────────────────────────────────
  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  // ─── Modal helpers ──────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      displayOrder: categories.length,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (cat: CollectionCategory) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      displayOrder: cat.displayOrder,
      isActive: cat.isActive,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
  };

  // ─── Form handlers ──────────────────────────────────────────────────────────
  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => {
      const newState = { ...prev, [name]: val };
      // Auto‑generate slug if name changes and slug is empty or was auto‑generated (optional)
      // For simplicity, we let the user edit slug manually; we could auto‑fill only on create.
      return newState;
    });
  };

  // Auto‑fill slug when name changes (only if slug is empty or equals the auto‑generated from previous name)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData((prev) => {
      // If we haven't edited slug yet, or slug matches the auto‑generated from previous name, update it
      const autoSlug = generateSlug(newName);
      const prevAutoSlug = generateSlug(prev.name);
      const keepSlug = prev.slug && prev.slug !== prevAutoSlug;
      return {
        ...prev,
        name: newName,
        slug: keepSlug ? prev.slug : autoSlug,
      };
    });
  };

  // ─── CRUD operations ────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const isEdit = !!editingCategory;
      const url = isEdit ? `${API_BASE}/${editingCategory.id}` : API_BASE;
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || generateSlug(formData.name.trim()),
        description: formData.description.trim() || undefined,
        displayOrder: Number(formData.displayOrder),
        isActive: formData.isActive,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || `Failed to ${isEdit ? "update" : "create"} category`);
      }

      toast.success(`Category ${isEdit ? "updated" : "created"} successfully!`);
      await fetchCategories();
      closeModal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${id}/toggle`, { method: "PATCH" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Toggle failed");
      }
      toast.success(`Category ${!currentActive ? "activated" : "deactivated"}`);
      await fetchCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Toggle error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete category "${name}"?\n\nThis will also delete ALL its items and their images (cascade). This action cannot be undone.`
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Delete failed");
      }
      toast.success("Category deleted successfully");
      await fetchCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete error");
    } finally {
      setLoading(false);
    }
  };

  // ─── Reorder (up/down) ─────────────────────────────────────────────────────
  const handleReorder = async (id: string, direction: "up" | "down") => {
    const idx = categories.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= categories.length) return;

    // Swap displayOrder values
    const currentOrder = categories[idx].displayOrder;
    const targetOrder = categories[targetIdx].displayOrder;

    // We'll update both categories with swapped orders
    const updates = [
      { id: categories[idx].id, displayOrder: targetOrder },
      { id: categories[targetIdx].id, displayOrder: currentOrder },
    ];

    try {
      setLoading(true);
      // Perform two PUT requests sequentially
      for (const update of updates) {
        const res = await fetch(`${API_BASE}/${update.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: update.displayOrder }),
        });
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.message || "Reorder failed");
        }
      }
      toast.success("Order updated successfully");
      await fetchCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reorder error");
    } finally {
      setLoading(false);
    }
  };

  // ─── Client‑side filtering ─────────────────────────────────────────────────
  const filteredCategories = categories.filter((cat) => {
    const matchesSearch = cat.name.toLowerCase().includes(search.toLowerCase()) ||
                          cat.slug.toLowerCase().includes(search.toLowerCase());
    const matchesActive = activeFilter === undefined || cat.isActive === activeFilter;
    return matchesSearch && matchesActive;
  });

  // Sort by displayOrder (descending? Actually ascending, but we can keep as‑is)
  const sorted = [...filteredCategories].sort((a, b) => a.displayOrder - b.displayOrder);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 bg-[#F9F9F9] min-h-screen text-[#1A1A1A]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-heading text-[#1A1A1A]">Collection Categories</h1>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-md bg-[#D4AF37] text-white text-sm font-medium hover:bg-[#b8972e] transition-colors"
          >
            + Add Category
          </button>
        </div>

        {/* Filters and search */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
            />
          </div>
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
              setActiveFilter(undefined);
            }}
            className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A]"
          >
            Clear filters
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E5] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#F9F9F9] border-b border-[#E5E5E5]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-[#1A1A1A]">Order</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1A1A1A]">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] hidden md:table-cell">Slug</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] hidden lg:table-cell">Description</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1A1A1A]">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-[#1A1A1A]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[#6B6B6B]">
                      No categories found.
                    </td>
                  </tr>
                ) : (
                  sorted.map((cat, index) => (
                    <tr key={cat.id} className="border-b border-[#E5E5E5] hover:bg-[#F9F9F9]/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-[#6B6B6B]">{cat.displayOrder}</span>
                          <button
                            onClick={() => handleReorder(cat.id, "up")}
                            disabled={index === 0}
                            className={`p-1 rounded hover:bg-[#F9F9F9] ${
                              index === 0 ? "text-[#ABABAB] cursor-not-allowed" : "text-[#1A1A1A]"
                            }`}
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => handleReorder(cat.id, "down")}
                            disabled={index === sorted.length - 1}
                            className={`p-1 rounded hover:bg-[#F9F9F9] ${
                              index === sorted.length - 1 ? "text-[#ABABAB] cursor-not-allowed" : "text-[#1A1A1A]"
                            }`}
                            title="Move down"
                          >
                            ↓
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{cat.name}</td>
                      <td className="px-4 py-3 text-[#6B6B6B] hidden md:table-cell">{cat.slug}</td>
                      <td className="px-4 py-3 text-[#6B6B6B] hidden lg:table-cell max-w-xs truncate">
                        {cat.description || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full ${
                            cat.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {cat.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(cat.id, cat.isActive)}
                            className={`p-1 rounded hover:bg-[#F9F9F9] text-sm ${
                              cat.isActive ? "text-[#D4AF37]" : "text-[#6B6B6B]"
                            }`}
                            title={cat.isActive ? "Deactivate" : "Activate"}
                          >
                            {cat.isActive ? "✓" : "✕"}
                          </button>
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-1 rounded hover:bg-[#F9F9F9] text-[#1A1A1A]"
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id, cat.name)}
                            className="p-1 rounded hover:bg-red-50 text-red-500"
                            title="Delete (cascades to items)"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Create/Edit Modal ──────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-heading mb-4">
              {editingCategory ? "Edit Category" : "Add New Category"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#1A1A1A]">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  placeholder="e.g. Skincare"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-[#1A1A1A]">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  value={formData.slug}
                  onChange={handleFormChange}
                  required
                  pattern="[a-z0-9-]+"
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  placeholder="e.g. skincare"
                />
                <p className="text-xs text-[#6B6B6B] mt-1">Lowercase letters, numbers, hyphens only.</p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-[#1A1A1A]">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={2}
                  value={formData.description}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  placeholder="Brief description"
                />
              </div>

              <div>
                <label htmlFor="displayOrder" className="block text-sm font-medium text-[#1A1A1A]">
                  Display Order (number)
                </label>
                <input
                  id="displayOrder"
                  name="displayOrder"
                  type="number"
                  min={0}
                  value={formData.displayOrder}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                />
                <p className="text-xs text-[#6B6B6B] mt-1">Lower numbers appear first in the tabs.</p>
              </div>

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
                  Active (visible in store)
                </label>
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
                  className="px-4 py-2 rounded-md bg-[#D4AF37] text-white text-sm font-medium hover:bg-[#b8972e] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Saving..." : editingCategory ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}