/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Pencil,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  X,
  ImageIcon,
  Layers,
} from "lucide-react";
import type { ChangeEvent } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type HeroSlide = {
  id: string;
  imageUrl: string;
  title: string | null;
  subtitle: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

const MAX_SLIDES = 5;
const API_BASE   = "/api/ui/hero";

// ─── Shared input class (matches SiteContentClient) ───────────────────────────
const inputCls =
  "w-full border border-gray-200 rounded-sm px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-colors";

// ─── Main component ───────────────────────────────────────────────────────────
export default function HeroSection() {
  const [slides, setSlides]           = useState<HeroSlide[]>([]);
  const [loading, setLoading]         = useState(true);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [formData, setFormData]       = useState({ title: "", subtitle: "", order: 0, isActive: true });
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting]   = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchSlides = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}?all=true`);
      const json: ApiResponse<HeroSlide[]> = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to fetch slides");
      setSlides(json.data || []);
    } catch (err) {
      toast.error("Failed to load slides", {
        description: err instanceof Error ? err.message : "Unknown error"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSlides(); }, [fetchSlides]);

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingSlide(null);
    setFormData({ title: "", subtitle: "", order: slides.length, isActive: true });
    setImageFile(null);
    setImagePreview(null);
    setModalOpen(true);
  };

  const openEditModal = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setFormData({ title: slide.title || "", subtitle: slide.subtitle || "", order: slide.order, isActive: slide.isActive });
    setImageFile(null);
    setImagePreview(slide.imageUrl);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSlide(null);
    setImageFile(null);
    setImagePreview(null);
  };

  // ── Form handlers ──────────────────────────────────────────────────────────
  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  // ── Submit (create / update) ───────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const isEdit = !!editingSlide;
      const url    = isEdit ? `${API_BASE}/${editingSlide.id}` : API_BASE;
      const method = isEdit ? "PUT" : "POST";
      let body: FormData | string;
      let headers: HeadersInit = {};

      if (imageFile) {
        const form = new FormData();
        form.append("image",    imageFile);
        form.append("title",    formData.title);
        form.append("subtitle", formData.subtitle);
        form.append("order",    String(formData.order));
        form.append("isActive", String(formData.isActive));
        body = form;
      } else {
        if (!isEdit) {
          toast.error("Image required", {
            description: "Please select an image file for a new slide."
          });
          setSubmitting(false);
          return;
        }
        const payload: any = {
          title:    formData.title    || undefined,
          subtitle: formData.subtitle || undefined,
          order:    formData.order,
          isActive: formData.isActive,
        };
        body = JSON.stringify(payload);
        headers["Content-Type"] = "application/json";
      }

      const res  = await fetch(url, { method, headers, body });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message || `Failed to ${isEdit ? "update" : "create"} slide`);

      toast.success(isEdit ? "Slide updated" : "Slide created", {
        description: isEdit ? "Your changes have been saved." : "New slide added successfully."
      });

      await fetchSlides();
      closeModal();
    } catch (err) {
      toast.error("Operation failed", {
        description: err instanceof Error ? err.message : "Submission error"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this slide and its image permanently?")) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Delete failed");
      toast.success("Slide deleted", {
        description: "The slide has been removed successfully."
      });
      await fetchSlides();
    } catch (err) {
      toast.error("Delete failed", {
        description: err instanceof Error ? err.message : "Could not delete slide"
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Toggle active ──────────────────────────────────────────────────────────
  const handleToggle = async (id: string) => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/${id}/toggle`, { method: "PATCH" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Toggle failed");
      toast.success("Visibility updated", {
        description: json.message || "Slide visibility changed."
      });
      await fetchSlides();
    } catch (err) {
      toast.error("Toggle failed", {
        description: err instanceof Error ? err.message : "Could not toggle visibility"
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Reorder ────────────────────────────────────────────────────────────────
  const handleReorder = async (id: string, direction: "up" | "down") => {
    const index = slides.findIndex((s) => s.id === id);
    if (index === -1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const newSlides = [...slides];
    const curOrder  = newSlides[index].order;
    const tgtOrder  = newSlides[targetIndex].order;
    newSlides[index].order        = tgtOrder;
    newSlides[targetIndex].order  = curOrder;
    newSlides.sort((a, b) => a.order - b.order);

    const payload = newSlides.map((s) => ({ id: s.id, order: s.order }));
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Reorder failed");
      toast.success("Order updated", {
        description: "Slides have been reordered successfully."
      });
      await fetchSlides();
    } catch (err) {
      toast.error("Reorder failed", {
        description: err instanceof Error ? err.message : "Could not reorder slides"
      });
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-8 bg-gray-50 min-h-screen">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-heading text-gray-900">Hero Slides</h1>
          <p className="text-sm text-gray-500 mt-1 font-sans">
            Manage the homepage hero carousel — max {MAX_SLIDES} slides
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Slide counter badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-sm text-sm text-gray-600 font-sans">
            <Layers className="w-4 h-4 text-gray-400" />
            <span>{slides.length} / {MAX_SLIDES} slides</span>
          </div>

          {/* Add button */}
          <button
            onClick={openCreateModal}
            disabled={slides.length >= MAX_SLIDES}
            className="flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-semibold text-black transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: slides.length >= MAX_SLIDES
                ? "#E5E5E5"
                : "linear-gradient(135deg, #D4AF37 0%, #ffe87c 50%, #b8952e 100%)",
              boxShadow: slides.length >= MAX_SLIDES ? "none" : "0 2px 10px rgba(212,175,55,0.35)",
              color: slides.length >= MAX_SLIDES ? "#ABABAB" : "black",
            }}
          >
            <Plus className="w-4 h-4" />
            Add Slide
          </button>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "#D4AF37", borderTopColor: "transparent" }}
          />
        </div>
      ) : slides.length === 0 ? (

        /* ── Empty state ── */
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-sm">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg, #1c1c1c, #141414)" }}
          >
            <ImageIcon className="w-6 h-6" style={{ color: "#D4AF37" }} />
          </div>
          <p className="text-gray-900 font-heading text-lg mb-1">No slides yet</p>
          <p className="text-sm text-gray-500 font-sans mb-5">Add your first hero slide to get started.</p>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-sm text-sm font-semibold text-black"
            style={{
              background: "linear-gradient(135deg, #D4AF37 0%, #ffe87c 50%, #b8952e 100%)",
              boxShadow: "0 2px 10px rgba(212,175,55,0.35)",
            }}
          >
            <Plus className="w-4 h-4" />
            Add First Slide
          </button>
        </div>

      ) : (

        /* ── Slide list ── */
        <div className="space-y-3">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              className="bg-white border border-gray-200 rounded-sm flex items-center gap-4 p-4 hover:shadow-sm transition-shadow"
            >
              {/* Thumbnail */}
              <div className="w-28 h-18 flex-shrink-0 relative bg-gray-50 rounded-sm overflow-hidden border border-gray-100" style={{ height: 72 }}>
                <Image
                  src={slide.imageUrl}
                  alt={slide.title || "Slide"}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {slide.title || <span className="text-gray-400 font-normal italic">Untitled</span>}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${
                      slide.isActive
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-gray-100 text-gray-500 border border-gray-200"
                    }`}
                  >
                    {slide.isActive ? "Active" : "Inactive"}
                  </span>
                  <span className="text-[10px] text-gray-400 font-sans border border-gray-200 px-2 py-0.5 rounded-full">
                    Order {slide.order}
                  </span>
                </div>
                {slide.subtitle && (
                  <p className="text-xs text-gray-500 font-sans truncate">{slide.subtitle}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Move up */}
                <button
                  onClick={() => handleReorder(slide.id, "up")}
                  disabled={idx === 0}
                  className="p-1.5 rounded-sm hover:bg-gray-50 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move up"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>

                {/* Move down */}
                <button
                  onClick={() => handleReorder(slide.id, "down")}
                  disabled={idx === slides.length - 1}
                  className="p-1.5 rounded-sm hover:bg-gray-50 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move down"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Toggle active */}
                <button
                  onClick={() => handleToggle(slide.id)}
                  className="p-1.5 rounded-sm hover:bg-gray-50 transition-colors"
                  title={slide.isActive ? "Deactivate" : "Activate"}
                  style={{ color: slide.isActive ? "#D4AF37" : "#9CA3AF" }}
                >
                  {slide.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                {/* Edit */}
                <button
                  onClick={() => openEditModal(slide)}
                  className="p-1.5 rounded-sm hover:bg-gray-50 text-gray-500 hover:text-gray-800 transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(slide.id)}
                  className="p-1.5 rounded-sm hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
              style={{ borderBottom: "1px solid rgba(212,175,55,0.2)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-sm"
                  style={{ background: "linear-gradient(135deg, #1c1c1c, #141414)" }}
                >
                  <ImageIcon className="w-4 h-4" style={{ color: "#D4AF37" }} />
                </div>
                <h2 className="font-heading text-lg text-gray-900">
                  {editingSlide ? "Edit Slide" : "Add New Slide"}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-sm hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

              {/* Image upload */}
              <div>
                <label className="block text-[11px] uppercase tracking-[0.12em] font-semibold text-gray-600 mb-1.5">
                  Image {!editingSlide && <span className="text-red-500 normal-case">*</span>}
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:text-black file:cursor-pointer hover:file:opacity-90 transition-colors"
                  style={{ "--file-bg": "linear-gradient(135deg, #D4AF37 0%, #ffe87c 50%, #b8952e 100%)" } as any}
                />
                {imagePreview && (
                  <div className="mt-3 w-full h-36 relative bg-gray-50 rounded-sm overflow-hidden border border-gray-200">
                    <Image src={imagePreview} alt="Preview" fill className="object-cover" sizes="400px" />
                  </div>
                )}
                {!editingSlide && !imageFile && (
                  <p className="text-xs text-gray-400 mt-1 font-sans">An image file is required for a new slide.</p>
                )}
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-[11px] uppercase tracking-[0.12em] font-semibold text-gray-600 mb-1.5">
                  Title <span className="normal-case text-gray-400">(optional)</span>
                </label>
                <input
                  id="title" name="title" type="text"
                  value={formData.title} onChange={handleFormChange}
                  placeholder="Main heading overlay"
                  className={inputCls}
                />
              </div>

              {/* Subtitle */}
              <div>
                <label htmlFor="subtitle" className="block text-[11px] uppercase tracking-[0.12em] font-semibold text-gray-600 mb-1.5">
                  Subtitle <span className="normal-case text-gray-400">(optional)</span>
                </label>
                <textarea
                  id="subtitle" name="subtitle" rows={2}
                  value={formData.subtitle} onChange={handleFormChange}
                  placeholder="Supporting text"
                  className={inputCls + " resize-none"}
                />
              </div>

              {/* Order + Active row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="order" className="block text-[11px] uppercase tracking-[0.12em] font-semibold text-gray-600 mb-1.5">
                    Display Order
                  </label>
                  <input
                    id="order" name="order" type="number" min={0}
                    value={formData.order} onChange={handleFormChange}
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col justify-end pb-0.5">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      id="isActive" name="isActive" type="checkbox"
                      checked={formData.isActive} onChange={handleFormChange}
                      className="w-4 h-4 rounded border-gray-300 accent-[#D4AF37] cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 font-sans">Active (visible)</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button" onClick={closeModal}
                  className="px-4 py-2 rounded-sm border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-sm text-sm font-semibold text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg, #D4AF37 0%, #ffe87c 50%, #b8952e 100%)",
                    boxShadow: "0 2px 10px rgba(212,175,55,0.35)",
                  }}
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  {submitting ? "Saving…" : editingSlide ? "Update Slide" : "Create Slide"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
