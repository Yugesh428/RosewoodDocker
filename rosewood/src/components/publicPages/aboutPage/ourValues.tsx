/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";

// Types based on the Value model
type Value = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
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

const API_BASE = "/api/ui/values";

export default function ValuesSection() {
  const [values, setValues] = useState<Value[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtering / search (client‑side)
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
    undefined,
  );

  // Modal state for create / edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<Value | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "", // for preview and existing URL
    imageFile: null as File | null,
    displayOrder: 0,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // ─── Fetch values (admin: ?all=true) ──────────────────────────────────────
  const fetchValues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}?all=true`);
      const json: ApiResponse<Value[]> = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to fetch values");
      }
      setValues(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchValues();
  }, [fetchValues]);

  // ─── Modal helpers ──────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingValue(null);
    setFormData({
      title: "",
      description: "",
      imageUrl: "",
      imageFile: null,
      displayOrder: values.length,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (v: Value) => {
    setEditingValue(v);
    setFormData({
      title: v.title,
      description: v.description,
      imageUrl: v.imageUrl || "",
      imageFile: null,
      displayOrder: v.displayOrder,
      isActive: v.isActive,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingValue(null);
  };

  // ─── Form handlers ──────────────────────────────────────────────────────────
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const val =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({
          ...prev,
          imageFile: file,
          imageUrl: reader.result as string, // preview
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({ ...prev, imageFile: null, imageUrl: "" }));
    }
  };

  // ─── CRUD operations ────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const isEdit = !!editingValue;
      const url = isEdit ? `${API_BASE}/${editingValue.id}` : API_BASE;
      const method = isEdit ? "PUT" : "POST";

      let body: FormData | string;
      let headers: HeadersInit = {};

      // If we have a new image file, use FormData
      const useFormData = formData.imageFile !== null;

      if (useFormData) {
        const form = new FormData();
        form.append("image", formData.imageFile!);
        form.append("title", formData.title.trim());
        form.append("description", formData.description.trim());
        form.append("displayOrder", String(formData.displayOrder));
        form.append("isActive", String(formData.isActive));
        body = form;
      } else {
        // JSON body: for edit, we can send imageUrl (existing) or omit to keep old
        const payload: any = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          displayOrder: formData.displayOrder,
          isActive: formData.isActive,
        };
        if (!isEdit) {
          // For creation without a file, we need to provide an imageUrl (if they entered a URL manually)
          // The API also accepts imageUrl in JSON. We'll require a file for create to simplify,
          // but we can allow a URL fallback if they entered one.
          if (formData.imageUrl && !formData.imageUrl.startsWith("data:")) {
            payload.imageUrl = formData.imageUrl;
          } else {
            throw new Error("Please select an image file for a new value.");
          }
        } else {
          // For edit: if imageUrl was explicitly set to null (removed), we can send imageUrl: null
          // But we don't have a "remove" button yet; we'll keep it simple.
          // We'll send imageUrl only if they changed it to a new URL (not from file)
          if (formData.imageUrl && !formData.imageUrl.startsWith("data:")) {
            payload.imageUrl = formData.imageUrl;
          }
          // If the user wants to remove the image, we could add a checkbox, but for now we keep it.
        }
        body = JSON.stringify(payload);
        headers["Content-Type"] = "application/json";
      }

      const res = await fetch(url, {
        method,
        headers,
        body: body instanceof FormData ? body : JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          json.message || `Failed to ${isEdit ? "update" : "create"} value`,
        );
      }

      await fetchValues();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission error");
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
      await fetchValues();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Toggle error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the value "${title}"?`))
      return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Delete failed");
      }
      await fetchValues();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete error");
    } finally {
      setLoading(false);
    }
  };

  // ─── Reorder (up/down) ─────────────────────────────────────────────────────
  const handleReorder = async (id: string, direction: "up" | "down") => {
    const idx = values.findIndex((v) => v.id === id);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= values.length) return;

    // Swap displayOrder values and update all orders
    const newOrder = [...values];
    const currentOrder = newOrder[idx].displayOrder;
    const targetOrder = newOrder[targetIdx].displayOrder;
    newOrder[idx].displayOrder = targetOrder;
    newOrder[targetIdx].displayOrder = currentOrder;

    // Sort by displayOrder
    newOrder.sort((a, b) => a.displayOrder - b.displayOrder);

    const payload = newOrder.map((v) => ({
      id: v.id,
      displayOrder: v.displayOrder,
    }));

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Reorder failed");
      }
      await fetchValues();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reorder error");
    } finally {
      setLoading(false);
    }
  };

  // ─── Client‑side filtering ─────────────────────────────────────────────────
  const filtered = values.filter((v) => {
    const matchesSearch =
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.description.toLowerCase().includes(search.toLowerCase());
    const matchesActive =
      activeFilter === undefined || v.isActive === activeFilter;
    return matchesSearch && matchesActive;
  });

  // Sort by displayOrder
  const sorted = [...filtered].sort((a, b) => a.displayOrder - b.displayOrder);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 bg-[#F9F9F9] min-h-screen text-[#1A1A1A]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-heading text-[#1A1A1A]">Our Values</h1>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-md bg-[#D4AF37] text-white text-sm font-medium hover:bg-[#b8972e] transition-colors"
          >
            + Add Value
          </button>
        </div>

        {/* Filters and search */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by title or description..."
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

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md border border-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E5] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#F9F9F9] border-b border-[#E5E5E5]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-[#1A1A1A]">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[#1A1A1A]">
                    Icon
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[#1A1A1A]">
                    Title & Description
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[#1A1A1A]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-[#1A1A1A]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-[#6B6B6B]"
                    >
                      No values found.
                    </td>
                  </tr>
                ) : (
                  sorted.map((v, index) => (
                    <tr
                      key={v.id}
                      className="border-b border-[#E5E5E5] hover:bg-[#F9F9F9]/50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-[#6B6B6B]">
                            {v.displayOrder}
                          </span>
                          <button
                            onClick={() => handleReorder(v.id, "up")}
                            disabled={index === 0}
                            className={`p-1 rounded hover:bg-[#F9F9F9] ${
                              index === 0
                                ? "text-[#ABABAB] cursor-not-allowed"
                                : "text-[#1A1A1A]"
                            }`}
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => handleReorder(v.id, "down")}
                            disabled={index === sorted.length - 1}
                            className={`p-1 rounded hover:bg-[#F9F9F9] ${
                              index === sorted.length - 1
                                ? "text-[#ABABAB] cursor-not-allowed"
                                : "text-[#1A1A1A]"
                            }`}
                            title="Move down"
                          >
                            ↓
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-10 h-10 relative bg-[#F9F9F9] rounded-md overflow-hidden border border-[#E5E5E5] flex items-center justify-center">
                          {v.imageUrl ? (
                            <Image
                              src={v.imageUrl}
                              alt={v.title}
                              fill
                              className="object-contain p-1"
                              sizes="40px"
                            />
                          ) : (
                            <span className="text-[#ABABAB] text-xs">
                              No icon
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{v.title}</div>
                        <div className="text-xs text-[#6B6B6B] truncate max-w-xs">
                          {v.description}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full ${
                            v.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {v.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(v.id, v.isActive)}
                            className={`p-1 rounded hover:bg-[#F9F9F9] text-sm ${
                              v.isActive ? "text-[#D4AF37]" : "text-[#6B6B6B]"
                            }`}
                            title={v.isActive ? "Deactivate" : "Activate"}
                          >
                            {v.isActive ? "✓" : "✕"}
                          </button>
                          <button
                            onClick={() => openEditModal(v)}
                            className="p-1 rounded hover:bg-[#F9F9F9] text-[#1A1A1A]"
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => handleDelete(v.id, v.title)}
                            className="p-1 rounded hover:bg-red-50 text-red-500"
                            title="Delete"
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
              {editingValue ? "Edit Value" : "Add New Value"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A]">
                  Icon (SVG recommended){" "}
                  {!editingValue && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="file"
                  accept="image/svg+xml,image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleFileChange}
                  className="w-full text-sm text-[#6B6B6B] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#D4AF37] file:text-white hover:file:bg-[#b8972e]"
                />
                {formData.imageUrl && (
                  <div className="mt-2 w-16 h-16 relative bg-[#F9F9F9] rounded-md overflow-hidden border border-[#E5E5E5]">
                    <Image
                      src={formData.imageUrl}
                      alt="Icon preview"
                      fill
                      className="object-contain p-1"
                      sizes="64px"
                    />
                  </div>
                )}
                {!editingValue && !formData.imageFile && (
                  <p className="text-xs text-[#6B6B6B] mt-1">
                    A new value requires an icon (SVG preferred).
                  </p>
                )}
              </div>

              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleFormChange}
                  required
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  placeholder="e.g. Trust"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleFormChange}
                  required
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  placeholder="Brief description of the value..."
                />
              </div>

              {/* Display Order */}
              <div>
                <label
                  htmlFor="displayOrder"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
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
                <p className="text-xs text-[#6B6B6B] mt-1">
                  Lower numbers appear first.
                </p>
              </div>

              {/* Active */}
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
                  Active (visible on frontend)
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
                  {submitting
                    ? "Saving..."
                    : editingValue
                      ? "Update"
                      : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
