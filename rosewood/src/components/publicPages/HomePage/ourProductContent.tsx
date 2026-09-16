"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Plus,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  X,
  ImageIcon,
  Package,
  ChevronDown,
  Video,
  Image as ImageLucide,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type CollectionCategory = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  displayOrder: number;
};

type CollectionProduct = {
  id: string;
  categoryId: string;
  title: string;
  subtitle: string | null;
  backgroundImage: string | null;
  videoUrl: string | null;
  videoFile: string | null;
  photo1Url: string | null;
  photo1Title: string | null;
  photo1Subtitle: string | null;
  photo2Url: string | null;
  photo2Title: string | null;
  photo2Subtitle: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const PRODUCTS_API   = "/api/ui/collection/products";
const CATEGORIES_API = "/api/ui/collection/categories";

const inputCls =
  "w-full border border-gray-200 rounded-sm px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-colors";

const labelCls =
  "block text-[11px] uppercase tracking-[0.12em] font-semibold text-gray-600 mb-1.5";

// ─── Empty form state ─────────────────────────────────────────────────────────
const emptyForm = () => ({
  title:          "",
  subtitle:       "",
  categoryId:     "",
  videoUrl:       "",
  photo1Title:    "",
  photo1Subtitle: "",
  photo2Title:    "",
  photo2Subtitle: "",
  isActive:       true,
});

// ─── Component ────────────────────────────────────────────────────────────────
export default function OurProductContent() {
  // ── Data state ────────────────────────────────────────────────────────────
  const [products,   setProducts]   = useState<CollectionProduct[]>([]);
  const [categories, setCategories] = useState<CollectionCategory[]>([]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterActive,   setFilterActive]   = useState<string>("all");
  const [search,         setSearch]         = useState("");

  // ── Modal state ───────────────────────────────────────────────────────────
  const [modalOpen,     setModalOpen]     = useState(false);
  const [editingProduct, setEditingProduct] = useState<CollectionProduct | null>(null);

  // ── Form fields ───────────────────────────────────────────────────────────
  const [form, setForm] = useState(emptyForm());

  // ── Image files & previews ────────────────────────────────────────────────
  const [bgFile,     setBgFile]     = useState<File | null>(null);
  const [bgPreview,  setBgPreview]  = useState<string | null>(null);
  const [videoFile,  setVideoFile]  = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [clearVideoFile, setClearVideoFile] = useState(false);
  const [p1File,     setP1File]     = useState<File | null>(null);
  const [p1Preview,  setP1Preview]  = useState<string | null>(null);
  const [p2File,     setP2File]     = useState<File | null>(null);
  const [p2Preview,  setP2Preview]  = useState<string | null>(null);

  // ─── Fetch helpers ──────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${PRODUCTS_API}?all=true`);
      const json: ApiResponse<CollectionProduct[]> = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to fetch products");
      setProducts(json.data || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res  = await fetch(`${CATEGORIES_API}?all=true`);
      const json: ApiResponse<CollectionCategory[]> = await res.json();
      if (res.ok && json.success) setCategories(json.data || []);
    } catch {
      // non-critical — categories just won't populate the select
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  // ─── File picker helpers ────────────────────────────────────────────────
  const pickFile = (
    setter: (f: File | null) => void,
    previewSetter: (p: string | null) => void,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setter(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => previewSetter(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      previewSetter(null);
    }
  };

  // ─── Modal open / close ─────────────────────────────────────────────────
  const openCreate = () => {
    setEditingProduct(null);
    setForm({ ...emptyForm(), categoryId: categories[0]?.id ?? "" });
    setBgFile(null);  setBgPreview(null);
    setVideoFile(null); setVideoPreview(null); setClearVideoFile(false);
    setP1File(null);  setP1Preview(null);
    setP2File(null);  setP2Preview(null);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (p: CollectionProduct) => {
    setEditingProduct(p);
    setForm({
      title:          p.title,
      subtitle:       p.subtitle       ?? "",
      categoryId:     p.categoryId,
      videoUrl:       p.videoUrl       ?? "",
      photo1Title:    p.photo1Title    ?? "",
      photo1Subtitle: p.photo1Subtitle ?? "",
      photo2Title:    p.photo2Title    ?? "",
      photo2Subtitle: p.photo2Subtitle ?? "",
      isActive:       p.isActive,
    });
    setBgFile(null);  setBgPreview(p.backgroundImage);
    setVideoFile(null); setVideoPreview(p.videoFile); setClearVideoFile(false);
    setP1File(null);  setP1Preview(p.photo1Url);
    setP2File(null);  setP2Preview(p.photo2Url);
    setError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setBgFile(null);  setBgPreview(null);
    setVideoFile(null); setVideoPreview(null); setClearVideoFile(false);
    setP1File(null);  setP1Preview(null);
    setP2File(null);  setP2Preview(null);
    setError(null);
  };

  // ─── Form field change ──────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // ─── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!form.title.trim())      { setError("Title is required."); return; }
    if (!form.categoryId)        { setError("Category is required."); return; }

    setSubmitting(true);

    try {
      const isEdit = !!editingProduct;
      const url    = isEdit ? `${PRODUCTS_API}/${editingProduct!.id}` : PRODUCTS_API;
      const method = isEdit ? "PUT" : "POST";

      // Always use FormData so images can be included
      const fd = new FormData();
      fd.append("title",          form.title.trim());
      fd.append("subtitle",       form.subtitle.trim());
      fd.append("categoryId",     form.categoryId);
      fd.append("videoUrl",       form.videoUrl.trim());
      fd.append("photo1Title",    form.photo1Title.trim());
      fd.append("photo1Subtitle", form.photo1Subtitle.trim());
      fd.append("photo2Title",    form.photo2Title.trim());
      fd.append("photo2Subtitle", form.photo2Subtitle.trim());
      fd.append("isActive",       String(form.isActive));

      if (bgFile)    fd.append("backgroundImage", bgFile);
      if (videoFile) fd.append("video", videoFile);
      else if (clearVideoFile) fd.append("videoFile", ""); // signal to clear
      if (p1File)    fd.append("photo1", p1File);
      if (p2File)    fd.append("photo2", p2File);

      const res  = await fetch(url, { method, body: fd });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || `Failed to ${isEdit ? "update" : "create"} product`);
        return;
      }

      toast.success(`Product ${isEdit ? "updated" : "created"} successfully!`);
      await fetchProducts();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission error");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Toggle ─────────────────────────────────────────────────────────────
  const handleToggle = async (id: string) => {
    try {
      const res  = await fetch(`${PRODUCTS_API}/${id}/toggle`, { method: "PATCH" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Toggle failed");
      toast.success("Product status updated");
      await fetchProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Toggle error");
    }
  };

  // ─── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}" and all its images permanently?`)) return;
    try {
      const res  = await fetch(`${PRODUCTS_API}/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Delete failed");
      toast.success("Product deleted successfully");
      await fetchProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete error");
    }
  };

  // ─── Client-side filter ─────────────────────────────────────────────────
  const filtered = products.filter((p) => {
    if (filterCategory !== "all" && p.categoryId !== filterCategory) return false;
    if (filterActive   === "active"   && !p.isActive) return false;
    if (filterActive   === "inactive" &&  p.isActive) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !p.title.toLowerCase().includes(q) &&
        !(p.subtitle?.toLowerCase().includes(q))
      ) return false;
    }
    return true;
  });

  // ─── Category name lookup ────────────────────────────────────────────────
  const catName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "—";

  // ─── Image preview block ─────────────────────────────────────────────────
  const PreviewBlock = ({
    preview,
    label,
    file,
    inputId,
    onFile,
    onClear,
  }: {
    preview: string | null;
    label: string;
    file: File | null;
    inputId: string;
    onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClear: () => void;
  }) => (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={inputId} className={labelCls + " mb-0"}>
          {label}
        </label>
        {(preview || file) && (
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] text-red-400 hover:text-red-600 font-sans"
          >
            Remove
          </button>
        )}
      </div>
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={onFile}
        className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:text-black file:cursor-pointer hover:file:opacity-90"
      />
      {preview && (
        <div className="mt-2 w-full h-28 relative bg-gray-50 rounded-sm overflow-hidden border border-gray-200">
          <Image src={preview} alt={label} fill className="object-cover" sizes="400px" />
        </div>
      )}
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="p-8 bg-gray-50 min-h-screen">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-heading text-gray-900">Product Collection Items</h1>
          <p className="text-sm text-gray-500 mt-1 font-sans">
            Manage cards displayed inside each collection category tab
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-semibold text-black transition-all hover:opacity-90"
          style={{
            background:  "linear-gradient(135deg, #D4AF37 0%, #ffe87c 50%, #b8952e 100%)",
            boxShadow:   "0 2px 10px rgba(212,175,55,0.35)",
          }}
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Category filter */}
        <div className="relative">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="appearance-none bg-white border border-gray-200 rounded-sm pl-3 pr-8 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        </div>

        {/* Active filter */}
        <div className="relative">
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="appearance-none bg-white border border-gray-200 rounded-sm pl-3 pr-8 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by title or subtitle…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] bg-white border border-gray-200 rounded-sm px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
        />

        {(filterCategory !== "all" || filterActive !== "all" || search) && (
          <button
            onClick={() => { setFilterCategory("all"); setFilterActive("all"); setSearch(""); }}
            className="text-xs text-gray-400 hover:text-gray-600 font-sans"
          >
            Clear
          </button>
        )}

        {/* Count badge */}
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-sm text-sm text-gray-600 font-sans">
          <Package className="w-4 h-4 text-gray-400" />
          <span>{filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
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
      ) : filtered.length === 0 ? (

        /* ── Empty state ── */
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-sm">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg, #1c1c1c, #141414)" }}
          >
            <Package className="w-6 h-6" style={{ color: "#D4AF37" }} />
          </div>
          <p className="text-gray-900 font-heading text-lg mb-1">
            {products.length === 0 ? "No products yet" : "No results match your filters"}
          </p>
          <p className="text-sm text-gray-500 font-sans mb-5">
            {products.length === 0
              ? "Add your first collection product card to get started."
              : "Try adjusting your search or filters."}
          </p>
          {products.length === 0 && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-sm text-sm font-semibold text-black"
              style={{
                background: "linear-gradient(135deg, #D4AF37 0%, #ffe87c 50%, #b8952e 100%)",
                boxShadow:  "0 2px 10px rgba(212,175,55,0.35)",
              }}
            >
              <Plus className="w-4 h-4" />
              Add First Product
            </button>
          )}
        </div>

      ) : (

        /* ── Product cards grid ── */
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-gray-200 rounded-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Thumbnail strip */}
              <div className="relative h-36 bg-gray-100 flex-shrink-0">
                {product.backgroundImage ? (
                  <Image
                    src={product.backgroundImage}
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageLucide className="w-8 h-8 text-gray-300" />
                  </div>
                )}

                {/* Status badge */}
                <span
                  className={`absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${
                    product.isActive
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-gray-100 text-gray-500 border border-gray-200"
                  }`}
                >
                  {product.isActive ? "Active" : "Inactive"}
                </span>

                {/* Secondary photo indicators */}
                <div className="absolute bottom-2 right-2 flex gap-1">
                  {product.videoUrl && (
                    <span className="flex items-center gap-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded-sm">
                      <Video className="w-3 h-3" /> Video
                    </span>
                  )}
                  {product.photo1Url && (
                    <span className="flex items-center gap-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded-sm">
                      <ImageLucide className="w-3 h-3" /> P1
                    </span>
                  )}
                  {product.photo2Url && (
                    <span className="flex items-center gap-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded-sm">
                      <ImageLucide className="w-3 h-3" /> P2
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-4 flex-1 flex flex-col">
                {/* Category tag */}
                <span
                  className="self-start text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide mb-2"
                  style={{
                    background: "rgba(212,175,55,0.12)",
                    color: "#b8952e",
                    border: "1px solid rgba(212,175,55,0.3)",
                  }}
                >
                  {catName(product.categoryId)}
                </span>

                <p className="text-sm font-semibold text-gray-900 truncate leading-snug">
                  {product.title}
                </p>
                {product.subtitle && (
                  <p className="text-xs text-gray-500 font-sans truncate mt-0.5">
                    {product.subtitle}
                  </p>
                )}

                {/* Action row */}
                <div className="flex items-center gap-1 mt-auto pt-4">
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(product.id)}
                    className="p-1.5 rounded-sm hover:bg-gray-50 transition-colors"
                    title={product.isActive ? "Deactivate" : "Activate"}
                    style={{ color: product.isActive ? "#D4AF37" : "#9CA3AF" }}
                  >
                    {product.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => openEdit(product)}
                    className="p-1.5 rounded-sm hover:bg-gray-50 text-gray-500 hover:text-gray-800 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(product.id, product.title)}
                    className="p-1.5 rounded-sm hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors ml-auto"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

            {/* Modal header */}
            <div
              className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(212,175,55,0.2)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-sm"
                  style={{ background: "linear-gradient(135deg, #1c1c1c, #141414)" }}
                >
                  <Package className="w-4 h-4" style={{ color: "#D4AF37" }} />
                </div>
                <h2 className="font-heading text-lg text-gray-900">
                  {editingProduct ? "Edit Product Card" : "Add New Product Card"}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-sm hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable form body */}
            <form
              onSubmit={handleSubmit}
              className="overflow-y-auto flex-1 px-6 py-5 space-y-6"
            >

              {/* ── Section: Basic Info ── */}
              <section>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-4 font-sans">
                  Basic Info
                </p>
                <div className="space-y-4">

                  {/* Category */}
                  <div>
                    <label htmlFor="categoryId" className={labelCls}>
                      Category <span className="text-red-400 normal-case">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="categoryId"
                        name="categoryId"
                        value={form.categoryId}
                        onChange={handleChange}
                        required
                        className={inputCls + " appearance-none pr-8 cursor-pointer"}
                      >
                        <option value="">— Select a category —</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label htmlFor="title" className={labelCls}>
                      Title <span className="text-red-400 normal-case">*</span>
                    </label>
                    <input
                      id="title" name="title" type="text"
                      value={form.title} onChange={handleChange}
                      placeholder="e.g. Advanced Skincare Regime"
                      className={inputCls}
                      required
                    />
                  </div>

                  {/* Subtitle */}
                  <div>
                    <label htmlFor="subtitle" className={labelCls}>
                      Subtitle <span className="text-gray-400 normal-case font-normal">(optional)</span>
                    </label>
                    <input
                      id="subtitle" name="subtitle" type="text"
                      value={form.subtitle} onChange={handleChange}
                      placeholder="Short supporting line"
                      className={inputCls}
                    />
                  </div>

                  {/* Active toggle */}
                  <div className="flex items-center gap-2.5">
                    <input
                      id="isActive" name="isActive" type="checkbox"
                      checked={form.isActive} onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-300 accent-[#D4AF37] cursor-pointer"
                    />
                    <label htmlFor="isActive" className="text-sm text-gray-700 font-sans cursor-pointer">
                      Active (visible on public site)
                    </label>
                  </div>
                </div>
              </section>

              {/* Divider */}
              <div className="h-px bg-gray-100" />

              {/* ── Section: Background Image ── */}
              <section>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-4 font-sans">
                  Background Image
                </p>
                <PreviewBlock
                  preview={bgPreview}
                  label="Background Image (optional)"
                  file={bgFile}
                  inputId="bgImage"
                  onFile={pickFile(setBgFile, setBgPreview)}
                  onClear={() => { setBgFile(null); setBgPreview(null); }}
                />
                <p className="text-xs text-gray-400 mt-1.5 font-sans">
                  JPEG, PNG, WebP, AVIF · max 5 MB
                </p>
              </section>

              {/* Divider */}
              <div className="h-px bg-gray-100" />

              {/* ── Section: Video ── */}
              <section>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-4 font-sans">
                  Video
                </p>
                <div className="space-y-4">
                  {/* Video URL */}
                  <div>
                    <label htmlFor="videoUrl" className={labelCls}>
                      Video URL <span className="text-gray-400 normal-case font-normal">(optional)</span>
                    </label>
                    <input
                      id="videoUrl" name="videoUrl" type="url"
                      value={form.videoUrl} onChange={handleChange}
                      placeholder="https://youtube.com/… or https://vimeo.com/…"
                      className={inputCls}
                    />
                    <p className="text-xs text-gray-400 mt-1 font-sans">
                      External video URL (YouTube, Vimeo, etc.)
                    </p>
                  </div>

                  {/* OR Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 font-sans uppercase tracking-wider">OR</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {/* Video File Upload */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="videoFile" className={labelCls + " mb-0"}>
                        Upload Video <span className="text-gray-400 normal-case font-normal">(optional)</span>
                      </label>
                      {(videoPreview || videoFile) && (
                        <button
                          type="button"
                          onClick={() => { setVideoFile(null); setVideoPreview(null); setClearVideoFile(true); }}
                          className="text-[10px] text-red-400 hover:text-red-600 font-sans"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      id="videoFile"
                      type="file"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime"
                      onChange={(e) => { setClearVideoFile(false); pickFile(setVideoFile, setVideoPreview)(e); }}
                      className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:text-black file:cursor-pointer hover:file:opacity-90"
                    />
                    <p className="text-xs text-gray-400 mt-1 font-sans">
                      MP4, WebM, OGG, MOV · max 50 MB
                    </p>
                    {videoPreview && (
                      <div className="mt-3 w-full h-48 relative bg-gray-900 rounded-sm overflow-hidden border border-gray-200">
                        <video
                          src={videoPreview}
                          controls
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Divider */}
              <div className="h-px bg-gray-100" />

              {/* ── Section: Secondary Photo 1 ── */}
              <section>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-4 font-sans">
                  Secondary Photo 1
                </p>
                <div className="space-y-4">
                  <PreviewBlock
                    preview={p1Preview}
                    label="Photo 1 Image (optional)"
                    file={p1File}
                    inputId="photo1"
                    onFile={pickFile(setP1File, setP1Preview)}
                    onClear={() => { setP1File(null); setP1Preview(null); }}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="photo1Title" className={labelCls}>
                        Photo 1 Title
                      </label>
                      <input
                        id="photo1Title" name="photo1Title" type="text"
                        value={form.photo1Title} onChange={handleChange}
                        placeholder="Label for photo 1"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="photo1Subtitle" className={labelCls}>
                        Photo 1 Subtitle
                      </label>
                      <input
                        id="photo1Subtitle" name="photo1Subtitle" type="text"
                        value={form.photo1Subtitle} onChange={handleChange}
                        placeholder="Sub-label for photo 1"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Divider */}
              <div className="h-px bg-gray-100" />

              {/* ── Section: Secondary Photo 2 ── */}
              <section>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-4 font-sans">
                  Secondary Photo 2
                </p>
                <div className="space-y-4">
                  <PreviewBlock
                    preview={p2Preview}
                    label="Photo 2 Image (optional)"
                    file={p2File}
                    inputId="photo2"
                    onFile={pickFile(setP2File, setP2Preview)}
                    onClear={() => { setP2File(null); setP2Preview(null); }}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="photo2Title" className={labelCls}>
                        Photo 2 Title
                      </label>
                      <input
                        id="photo2Title" name="photo2Title" type="text"
                        value={form.photo2Title} onChange={handleChange}
                        placeholder="Label for photo 2"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="photo2Subtitle" className={labelCls}>
                        Photo 2 Subtitle
                      </label>
                      <input
                        id="photo2Subtitle" name="photo2Subtitle" type="text"
                        value={form.photo2Subtitle} onChange={handleChange}
                        placeholder="Sub-label for photo 2"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* ── Error inside modal ── */}
              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-sm text-xs text-red-700 font-sans">
                  <X className="w-3.5 h-3.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* ── Modal actions ── */}
              <div
                className="flex justify-end gap-3 pt-2 pb-1 sticky bottom-0 bg-white"
                style={{ borderTop: "1px solid rgba(212,175,55,0.15)", paddingTop: "1rem" }}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-sm border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2 rounded-sm text-sm font-semibold text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90"
                  style={{
                    background:  "linear-gradient(135deg, #D4AF37 0%, #ffe87c 50%, #b8952e 100%)",
                    boxShadow:   "0 2px 10px rgba(212,175,55,0.35)",
                  }}
                >
                  {submitting && (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  )}
                  {submitting
                    ? "Saving…"
                    : editingProduct
                      ? "Update Product"
                      : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
