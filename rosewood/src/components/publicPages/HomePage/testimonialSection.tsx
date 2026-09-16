/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";

// Types based on the Testimonial model
type Testimonial = {
  id: string;
  photo: string;
  rating: number;
  quote: string;
  authorName: string;
  authorTitle: string | null;
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

const API_BASE = "/api/ui/testimonials";

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtering / search (client‑side)
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
    undefined,
  );

  // Modal state for create / edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] =
    useState<Testimonial | null>(null);
  const [formData, setFormData] = useState({
    photo: "", // URL or file data URL for preview
    photoFile: null as File | null,
    rating: 5,
    quote: "",
    authorName: "",
    authorTitle: "",
    displayOrder: 0,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // ─── Fetch testimonials (admin: ?all=true) ──────────────────────────────────
  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}?all=true`);
      const json: ApiResponse<Testimonial[]> = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to fetch testimonials");
      }
      setTestimonials(json.data || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  // ─── Star rendering helper ──────────────────────────────────────────────────
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={i < rating ? "text-[#D4AF37]" : "text-[#E5E5E5]"}
      >
        ★
      </span>
    ));
  };

  // ─── Modal helpers ──────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingTestimonial(null);
    setFormData({
      photo: "",
      photoFile: null,
      rating: 5,
      quote: "",
      authorName: "",
      authorTitle: "",
      displayOrder: testimonials.length,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (t: Testimonial) => {
    setEditingTestimonial(t);
    setFormData({
      photo: t.photo,
      photoFile: null,
      rating: t.rating,
      quote: t.quote,
      authorName: t.authorName,
      authorTitle: t.authorTitle || "",
      displayOrder: t.displayOrder,
      isActive: t.isActive,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTestimonial(null);
  };

  // ─── Form handlers ──────────────────────────────────────────────────────────
  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
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
          photoFile: file,
          photo: reader.result as string, // preview
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({ ...prev, photoFile: null, photo: "" }));
    }
  };

  // ─── CRUD operations ────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const isEdit = !!editingTestimonial;
      const url = isEdit ? `${API_BASE}/${editingTestimonial.id}` : API_BASE;
      const method = isEdit ? "PUT" : "POST";

      let body: FormData | string;
      let headers: HeadersInit = {};

      // If we have a photo file or we're creating and need a file, use FormData
      // For edit: if a new file is selected, use FormData; otherwise JSON with photoUrl
      const useFormData = formData.photoFile !== null;

      if (useFormData) {
        const form = new FormData();
        form.append("photo", formData.photoFile!);
        form.append("rating", String(formData.rating));
        form.append("quote", formData.quote.trim());
        form.append("authorName", formData.authorName.trim());
        form.append("authorTitle", formData.authorTitle.trim() || "");
        form.append("displayOrder", String(formData.displayOrder));
        form.append("isActive", String(formData.isActive));
        body = form;
      } else {
        // JSON body: require photoUrl for creation, optional for edit
        const payload: any = {
          rating: formData.rating,
          quote: formData.quote.trim(),
          authorName: formData.authorName.trim(),
          authorTitle: formData.authorTitle.trim() || undefined,
          displayOrder: formData.displayOrder,
          isActive: formData.isActive,
        };
        if (!isEdit) {
          // For creation without file, we need to provide a photoUrl (fallback)
          // The API expects photo or photoUrl. We'll require a file for create to simplify.
          throw new Error("Please select a photo file for a new testimonial.");
        } else {
          // For edit, if we have a photo URL (existing) and no new file, we don't send photo
          // The API will keep the existing photo
          if (formData.photo && !formData.photo.startsWith("data:")) {
            payload.photo = formData.photo;
          }
          // If photo is empty, we could send photo: null to delete? But API doesn't support that.
        }
        body = JSON.stringify(payload);
        headers["Content-Type"] = "application/json";
      }

      const res = await fetch(url, {
        method,
        headers,
        body,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          json.message ||
            `Failed to ${isEdit ? "update" : "create"} testimonial`,
        );
      }

      toast.success(`Testimonial ${isEdit ? "updated" : "created"} successfully!`);
      await fetchTestimonials();
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
      toast.success(`Testimonial ${!currentActive ? "activated" : "deactivated"}`);
      await fetchTestimonials();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Toggle error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, author: string) => {
    if (
      !confirm(`Are you sure you want to delete testimonial from "${author}"?`)
    )
      return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Delete failed");
      }
      toast.success("Testimonial deleted successfully");
      await fetchTestimonials();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete error");
    } finally {
      setLoading(false);
    }
  };

  // ─── Reorder (up/down) ─────────────────────────────────────────────────────
  const handleReorder = async (id: string, direction: "up" | "down") => {
    const idx = testimonials.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= testimonials.length) return;

    // Swap displayOrder values and update all orders (send full reorder array)
    const newOrder = [...testimonials];
    const currentOrder = newOrder[idx].displayOrder;
    const targetOrder = newOrder[targetIdx].displayOrder;
    newOrder[idx].displayOrder = targetOrder;
    newOrder[targetIdx].displayOrder = currentOrder;

    // Sort by displayOrder for consistent ordering
    newOrder.sort((a, b) => a.displayOrder - b.displayOrder);

    const payload = newOrder.map((t) => ({
      id: t.id,
      displayOrder: t.displayOrder,
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
      toast.success("Order updated successfully");
      await fetchTestimonials();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reorder error");
    } finally {
      setLoading(false);
    }
  };

  // ─── Client‑side filtering ─────────────────────────────────────────────────
  const filtered = testimonials.filter((t) => {
    const matchesSearch =
      t.authorName.toLowerCase().includes(search.toLowerCase()) ||
      t.quote.toLowerCase().includes(search.toLowerCase()) ||
      (t.authorTitle &&
        t.authorTitle.toLowerCase().includes(search.toLowerCase()));
    const matchesActive =
      activeFilter === undefined || t.isActive === activeFilter;
    return matchesSearch && matchesActive;
  });

  // Sort by displayOrder
  const sorted = [...filtered].sort((a, b) => a.displayOrder - b.displayOrder);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 bg-[#F9F9F9] min-h-screen text-[#1A1A1A]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-heading text-[#1A1A1A]">Testimonials</h1>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-md bg-[#D4AF37] text-white text-sm font-medium hover:bg-[#b8972e] transition-colors"
          >
            + Add Testimonial
          </button>
        </div>

        {/* Filters and search */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by author, quote, or title..."
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
                  <th className="px-4 py-3 text-left font-medium text-[#1A1A1A]">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[#1A1A1A]">
                    Photo
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[#1A1A1A]">
                    Author & Quote
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] hidden md:table-cell">
                    Rating
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
                      colSpan={6}
                      className="px-4 py-8 text-center text-[#6B6B6B]"
                    >
                      No testimonials found.
                    </td>
                  </tr>
                ) : (
                  sorted.map((t, index) => (
                    <tr
                      key={t.id}
                      className="border-b border-[#E5E5E5] hover:bg-[#F9F9F9]/50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-[#6B6B6B]">
                            {t.displayOrder}
                          </span>
                          <button
                            onClick={() => handleReorder(t.id, "up")}
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
                            onClick={() => handleReorder(t.id, "down")}
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
                        <div className="w-10 h-10 relative rounded-full overflow-hidden border border-[#E5E5E5] bg-[#F9F9F9]">
                          <Image
                            src={t.photo}
                            alt={t.authorName}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{t.authorName}</div>
                        {t.authorTitle && (
                          <div className="text-xs text-[#6B6B6B]">
                            {t.authorTitle}
                          </div>
                        )}
                        <div className="text-xs text-[#6B6B6B] truncate max-w-xs">
                          {t.quote}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          {renderStars(t.rating)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full ${
                            t.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {t.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(t.id, t.isActive)}
                            className={`p-1 rounded hover:bg-[#F9F9F9] text-sm ${
                              t.isActive ? "text-[#D4AF37]" : "text-[#6B6B6B]"
                            }`}
                            title={t.isActive ? "Deactivate" : "Activate"}
                          >
                            {t.isActive ? "✓" : "✕"}
                          </button>
                          <button
                            onClick={() => openEditModal(t)}
                            className="p-1 rounded hover:bg-[#F9F9F9] text-[#1A1A1A]"
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => handleDelete(t.id, t.authorName)}
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
              {editingTestimonial ? "Edit Testimonial" : "Add New Testimonial"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo upload */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A]">
                  Photo{" "}
                  {!editingTestimonial && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleFileChange}
                  className="w-full text-sm text-[#6B6B6B] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#D4AF37] file:text-white hover:file:bg-[#b8972e]"
                />
                {formData.photo && (
                  <div className="mt-2 w-20 h-20 relative rounded-full overflow-hidden border border-[#E5E5E5]">
                    <Image
                      src={formData.photo}
                      alt="Preview"
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                )}
                {!editingTestimonial && !formData.photoFile && (
                  <p className="text-xs text-[#6B6B6B] mt-1">
                    A new testimonial requires a photo.
                  </p>
                )}
              </div>

              {/* Rating */}
              <div>
                <label
                  htmlFor="rating"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Rating (1–5) <span className="text-red-500">*</span>
                </label>
                <select
                  id="rating"
                  name="rating"
                  value={formData.rating}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5].map((r) => (
                    <option key={r} value={r}>
                      {r} {r === 1 ? "Star" : "Stars"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quote */}
              <div>
                <label
                  htmlFor="quote"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Quote <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="quote"
                  name="quote"
                  rows={3}
                  value={formData.quote}
                  onChange={handleFormChange}
                  required
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  placeholder="What the customer said..."
                />
              </div>

              {/* Author Name */}
              <div>
                <label
                  htmlFor="authorName"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Author Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="authorName"
                  name="authorName"
                  type="text"
                  value={formData.authorName}
                  onChange={handleFormChange}
                  required
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  placeholder="e.g. Jane Doe"
                />
              </div>

              {/* Author Title */}
              <div>
                <label
                  htmlFor="authorTitle"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Author Title (optional)
                </label>
                <input
                  id="authorTitle"
                  name="authorTitle"
                  type="text"
                  value={formData.authorTitle}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  placeholder="e.g. Verified Customer"
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
                    : editingTestimonial
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
