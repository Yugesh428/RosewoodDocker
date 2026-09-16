/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import ProductImage from "@/components/ui/ProductImage";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = {
  id: string;
  categoryName: string;
  parentId: string | null;
};

type Ingredient = {
  id?: string;
  ingredientName: string;
  quantity: string;
  unit: string;
  sortOrder: number;
};

type Product = {
  id: string;
  categoryId: string;
  productName: string;
  productImage: string | null;
  productImages: string[];
  dosageForm: string;
  strength: string;
  packSize: string;
  unitType: string;
  sellingPrice: number;
  originalPrice: number;
  tax: number;
  discount: number;
  productDescriptions: { title: string; content: string }[];
  specifications: { key: string; value: string }[];
  suitableFor: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  ingredients?: Ingredient[];
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE = "/api/products";
const CAT_API  = "/api/product-categories";
const PAGE_SIZE = 10;

const SUITABLE_FOR_OPTIONS = [
  "vegetarian", "vegan", "gluten_free", "lactose_free",
  "diabetic_friendly", "children", "adults", "elderly", "pregnant_women",
];

const BLANK_FORM = {
  categoryId: "",
  productName: "",
  dosageForm: "",
  strength: "",
  packSize: "",
  unitType: "",
  sellingPrice: "",
  originalPrice: "",
  tax: "0",
  discount: "0",
  isActive: true,
  suitableFor: [] as string[],
  productDescriptions: [{ title: "", content: "" }] as { title: string; content: string }[],
  specifications: [] as { key: string; value: string }[],
  ingredients: [] as Ingredient[],
  howToUse: [] as string[],
  safetyInformation: [] as string[],
  imageFile: null as File | null,
  imageUrl: "",
  galleryFiles: [] as File[],
  existingGallery: [] as string[],
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductSection() {
  // List state
  const [products, setProducts]             = useState<Product[]>([]);
  const [pagination, setPagination]         = useState<Pagination | null>(null);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState("");
  const [activeFilter, setActiveFilter]     = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentPage, setCurrentPage]       = useState(1);

  // Categories
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  // Create / Edit modal
  const [modalOpen, setModalOpen]           = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm]                     = useState({ ...BLANK_FORM });
  const [submitting, setSubmitting]         = useState(false);
  const [activeTab, setActiveTab]           = useState<"basic" | "descriptions" | "specifications" | "ingredients" | "howToUse" | "safetyInformation">("basic");
  const [imagePreview, setImagePreview]     = useState<string | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [galleryUrlInput, setGalleryUrlInput] = useState("");

  // Bulk import
  const [bulkOpen, setBulkOpen]           = useState(false);
  const [bulkFile, setBulkFile]           = useState<File | null>(null);
  const [bulkJson, setBulkJson]           = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkResult, setBulkResult]       = useState<any>(null);

  // Detail modal
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen]       = useState(false);

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      p.set("page",  String(currentPage));
      p.set("limit", String(PAGE_SIZE));
      if (search)         p.set("search",     search);
      if (activeFilter)   p.set("isActive",   activeFilter);
      if (categoryFilter) p.set("categoryId", categoryFilter);

      const res  = await fetch(`${API_BASE}?${p}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to fetch");
      setProducts(json.data || []);
      setPagination(json.pagination || null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, activeFilter, categoryFilter]);

  const fetchCategories = useCallback(async () => {
    try {
      const res  = await fetch(`${CAT_API}?isActive=true&limit=500`);
      const json = await res.json();
      if (json.success) setAllCategories(json.data || []);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { fetchProducts(); },   [fetchProducts]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // ─── Modal helpers ───────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingProduct(null);
    setForm({ ...BLANK_FORM, productDescriptions: [{ title: "", content: "" }] });
    setImagePreview(null);
    setGalleryPreviews([]);
    setGalleryUrlInput("");
    setActiveTab("basic");
    setModalOpen(true);
  };

  const openEdit = async (p: Product) => {
    try {
      const res  = await fetch(`${API_BASE}/${p.id}`);
      const json = await res.json();
      const full: Product = json.data || p;
      setEditingProduct(full);
      setForm({
        categoryId:          full.categoryId,
        productName:         full.productName,
        dosageForm:          full.dosageForm,
        strength:            full.strength,
        packSize:            full.packSize,
        unitType:            full.unitType,
        sellingPrice:        String(full.sellingPrice),
        originalPrice:       String(full.originalPrice),
        tax:                 String(full.tax),
        discount:            String(full.discount),
        isActive:            full.isActive,
        suitableFor:         full.suitableFor || [],
        productDescriptions: full.productDescriptions?.length
          ? full.productDescriptions
          : [{ title: "", content: "" }],
        specifications: full.specifications || [],
        ingredients:    (full.ingredients || []).map((i) => ({
          id:             i.id,
          ingredientName: i.ingredientName,
          quantity:       i.quantity || "",
          unit:           i.unit || "",
          sortOrder:      i.sortOrder,
        })),
        howToUse:          full.howToUse          || [],
        safetyInformation: full.safetyInformation || [],
        imageFile: null,
        imageUrl:  full.productImage || "",
        galleryFiles: [],
        existingGallery: full.productImages || [],
      });
      setImagePreview(full.productImage || null);
      setGalleryPreviews(full.productImages || []);
      setGalleryUrlInput("");
      setActiveTab("basic");
      setModalOpen(true);
    } catch {
      toast.error("Could not load product details");
    }
  };

  const openDetail = async (p: Product) => {
    try {
      const res  = await fetch(`${API_BASE}/${p.id}`);
      const json = await res.json();
      setDetailProduct(json.data || p);
    } catch {
      setDetailProduct(p);
    }
    setDetailOpen(true);
  };

  // ─── Form field helpers ──────────────────────────────────────────────────────

  const setField = (key: keyof typeof BLANK_FORM, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setField("imageFile", file);
    if (file) { setImagePreview(URL.createObjectURL(file)); setField("imageUrl", ""); }
  };

  // descriptions
  const addDescription    = () => setField("productDescriptions", [...form.productDescriptions, { title: "", content: "" }]);
  const removeDescription = (i: number) => setField("productDescriptions", form.productDescriptions.filter((_, idx) => idx !== i));
  const updateDescription = (i: number, key: "title" | "content", val: string) =>
    setField("productDescriptions", form.productDescriptions.map((d, idx) => idx === i ? { ...d, [key]: val } : d));

  // specifications
  const addSpec    = () => setField("specifications", [...form.specifications, { key: "", value: "" }]);
  const removeSpec = (i: number) => setField("specifications", form.specifications.filter((_, idx) => idx !== i));
  const updateSpec = (i: number, k: "key" | "value", val: string) =>
    setField("specifications", form.specifications.map((s, idx) => idx === i ? { ...s, [k]: val } : s));

  // ingredients
  const addIngredient    = () => setField("ingredients", [...form.ingredients, { ingredientName: "", quantity: "", unit: "", sortOrder: form.ingredients.length }]);
  const removeIngredient = (i: number) => setField("ingredients", form.ingredients.filter((_, idx) => idx !== i));
  const updateIngredient = (i: number, key: keyof Ingredient, val: string | number) =>
    setField("ingredients", form.ingredients.map((ing, idx) => idx === i ? { ...ing, [key]: val } : ing));

  // suitable for
  const toggleSuitable = (tag: string) =>
    setField("suitableFor", form.suitableFor.includes(tag)
      ? form.suitableFor.filter((t) => t !== tag)
      : [...form.suitableFor, tag]);

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isEdit = !!editingProduct;
      const url    = isEdit ? `${API_BASE}/${editingProduct.id}` : API_BASE;
      const method = isEdit ? "PUT" : "POST";

      const descriptions   = form.productDescriptions.filter((d) => d.content.trim());
      const specifications = form.specifications.filter((s) => s.key.trim() && s.value.trim());
      const ingredients    = form.ingredients.filter((i) => i.ingredientName.trim());

      let body: FormData | string;
      let headers: HeadersInit = {};

      if (form.imageFile || form.galleryFiles.length > 0 || form.existingGallery.length > 0) {
        const fd = new FormData();
        if (form.imageFile) fd.append("image", form.imageFile);
        form.galleryFiles.forEach((file, idx) => fd.append(`gallery_${idx}`, file));
        // Always send existing gallery (includes URLs + previously uploaded paths)
        fd.append("productImages", JSON.stringify(form.existingGallery));
        fd.append("categoryId",      form.categoryId);
        fd.append("productName",     form.productName);
        fd.append("dosageForm",      form.dosageForm);
        fd.append("strength",        form.strength);
        fd.append("packSize",        form.packSize);
        fd.append("unitType",        form.unitType);
        fd.append("sellingPrice",    form.sellingPrice);
        fd.append("originalPrice",   form.originalPrice);
        fd.append("tax",             form.tax);
        fd.append("discount",        form.discount);
        fd.append("isActive",        String(form.isActive));
        fd.append("productDescriptions", JSON.stringify(descriptions));
        fd.append("specifications",      JSON.stringify(specifications));
        fd.append("suitableFor",         JSON.stringify(form.suitableFor));
        fd.append("ingredients",         JSON.stringify(ingredients));
        fd.append("howToUse",            JSON.stringify(form.howToUse.filter(s => s.trim())));
        fd.append("safetyInformation",   JSON.stringify(form.safetyInformation.filter(s => s.trim())));
        body = fd;
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify({
          categoryId: form.categoryId, productName: form.productName,
          dosageForm: form.dosageForm, strength: form.strength,
          packSize: form.packSize, unitType: form.unitType,
          sellingPrice: Number(form.sellingPrice), originalPrice: Number(form.originalPrice),
          tax: Number(form.tax), discount: Number(form.discount),
          isActive: form.isActive, imageUrl: form.imageUrl || null,
          productImages: form.existingGallery,
          productDescriptions: descriptions, specifications,
          suitableFor: form.suitableFor, ingredients,
          howToUse:          form.howToUse.filter(s => s.trim()),
          safetyInformation: form.safetyInformation.filter(s => s.trim()),
        });
      }

      const res  = await fetch(url, { method, headers, body });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Operation failed");

      toast.success(isEdit ? "Product updated" : "Product created");
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Toggle active ───────────────────────────────────────────────────────────

  const handleToggle = async (id: string) => {
    try {
      const res  = await fetch(`${API_BASE}/${id}/toggle-active`, { method: "PATCH" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Toggle failed");
      toast.success(json.message || "Status updated");
      fetchProducts();
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
        if (!Array.isArray(parsed)) throw new Error("Must be a JSON array");
        body    = JSON.stringify(parsed);
        headers = { "Content-Type": "application/json" };
      } else {
        throw new Error("Provide a file or JSON array");
      }
      const res  = await fetch(`${API_BASE}/bulk`, { method: "POST", headers, body });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Bulk import failed");
      setBulkResult(json);
      toast.success(`Imported ${json.summary?.created || 0} products`);
      fetchProducts();
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
          <h1 className="text-3xl font-heading">Products</h1>
          <div className="flex flex-wrap gap-3">
            <button onClick={openCreate}
              className="px-4 py-2 rounded-md bg-[#D4AF37] text-white text-sm font-medium hover:bg-[#b8952e] transition-colors">
              + Add Product
            </button>
            <button onClick={() => { setBulkFile(null); setBulkJson(""); setBulkResult(null); setBulkOpen(true); }}
              className="px-4 py-2 rounded-md border border-[#D4AF37] text-[#D4AF37] text-sm font-medium hover:bg-[#D4AF37]/10 transition-colors">
              Bulk Import
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input type="text" placeholder="Search by name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="flex-1 min-w-[180px] rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
          <select value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setCurrentPage(1); }}
            className="rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]">
            <option value="">All status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]">
            <option value="">All categories</option>
            {allCategories.map((c) => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
          </select>
          <button onClick={() => { setSearch(""); setActiveFilter(""); setCategoryFilter(""); setCurrentPage(1); }}
            className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A]">
            Clear
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E5] overflow-x-auto scrollbar-thin scrollbar-thumb-[#D4AF37]/40 scrollbar-track-transparent" style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}>
              <table className="text-sm" style={{ minWidth: "1200px", width: "100%" }}>
                <thead className="bg-[#F9F9F9] border-b border-[#E5E5E5] sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-3 text-left font-medium text-[#6B6B6B] whitespace-nowrap w-14">Image</th>
                    <th className="px-3 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap">Product Name</th>
                    <th className="px-3 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap">Category</th>
                    <th className="px-3 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap">Dosage Form</th>
                    <th className="px-3 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap">Strength</th>
                    <th className="px-3 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap">Pack Size</th>
                    <th className="px-3 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap">Unit Type</th>
                    <th className="px-3 py-3 text-right font-medium text-[#1A1A1A] whitespace-nowrap">Selling £</th>
                    <th className="px-3 py-3 text-right font-medium text-[#1A1A1A] whitespace-nowrap">Original £</th>
                    <th className="px-3 py-3 text-right font-medium text-[#1A1A1A] whitespace-nowrap">Tax %</th>
                    <th className="px-3 py-3 text-right font-medium text-[#1A1A1A] whitespace-nowrap">Discount %</th>
                    <th className="px-3 py-3 text-center font-medium text-[#1A1A1A] whitespace-nowrap">Ingredients</th>
                    <th className="px-3 py-3 text-center font-medium text-[#1A1A1A] whitespace-nowrap">Descriptions</th>
                    <th className="px-3 py-3 text-center font-medium text-[#1A1A1A] whitespace-nowrap">Suitable For</th>
                    <th className="px-3 py-3 text-center font-medium text-[#1A1A1A] whitespace-nowrap">Status</th>
                    <th className="px-3 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap">Created At</th>
                    <th className="px-3 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap">Updated At</th>
                    <th className="px-3 py-3 text-right font-medium text-[#1A1A1A] whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={18} className="px-4 py-10 text-center text-[#6B6B6B]">
                        No products found.
                      </td>
                    </tr>
                  ) : products.map((p) => (
                    <tr key={p.id} className="border-b border-[#E5E5E5] hover:bg-[#F9F9F9]/60 transition-colors">
                      {/* Image */}
                      <td className="px-3 py-3">
                        <ProductImage 
                          src={p.productImage} 
                          alt={p.productName}
                          width={44} 
                          height={44}
                          className="w-11 h-11 object-cover rounded border border-[#E5E5E5]" 
                        />
                      </td>
                      {/* Name */}
                      <td className="px-3 py-3 font-medium max-w-[160px]">
                        <p className="truncate">{p.productName}</p>
                      </td>
                      {/* Category */}
                      <td className="px-3 py-3 text-[#6B6B6B] whitespace-nowrap">
                        {p.category?.categoryName || "—"}
                      </td>
                      {/* Dosage Form */}
                      <td className="px-3 py-3 text-[#6B6B6B] whitespace-nowrap">
                        {p.dosageForm}
                      </td>
                      {/* Strength */}
                      <td className="px-3 py-3 text-[#6B6B6B] whitespace-nowrap">
                        {p.strength}
                      </td>
                      {/* Pack Size */}
                      <td className="px-3 py-3 text-[#6B6B6B] whitespace-nowrap">
                        {p.packSize}
                      </td>
                      {/* Unit Type */}
                      <td className="px-3 py-3 text-[#6B6B6B] whitespace-nowrap">
                        {p.unitType}
                      </td>
                      {/* Selling Price */}
                      <td className="px-3 py-3 text-right font-medium text-[#1A1A1A] whitespace-nowrap">
                        £{Number(p.sellingPrice).toFixed(2)}
                      </td>
                      {/* Original Price */}
                      <td className="px-3 py-3 text-right text-[#6B6B6B] whitespace-nowrap">
                        £{Number(p.originalPrice).toFixed(2)}
                      </td>
                      {/* Tax */}
                      <td className="px-3 py-3 text-right text-[#6B6B6B]">
                        {Number(p.tax) > 0 ? `${p.tax}%` : "—"}
                      </td>
                      {/* Discount */}
                      <td className="px-3 py-3 text-right">
                        {Number(p.discount) > 0 ? (
                          <span className="text-green-600 font-medium">{p.discount}%</span>
                        ) : "—"}
                      </td>
                      {/* Ingredients count */}
                      <td className="px-3 py-3 text-center">
                        {p.ingredients && p.ingredients.length > 0 ? (
                          <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                            {p.ingredients.length}
                          </span>
                        ) : (
                          <span className="text-[#6B6B6B]">—</span>
                        )}
                      </td>
                      {/* Descriptions count */}
                      <td className="px-3 py-3 text-center">
                        {p.productDescriptions && p.productDescriptions.length > 0 ? (
                          <span className="inline-block px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full">
                            {p.productDescriptions.length}
                          </span>
                        ) : (
                          <span className="text-[#6B6B6B]">—</span>
                        )}
                      </td>
                      {/* Suitable For */}
                      <td className="px-3 py-3 text-center">
                        {p.suitableFor?.length > 0 ? (
                          <span className="inline-block px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] text-xs rounded-full">
                            {p.suitableFor.length} tags
                          </span>
                        ) : (
                          <span className="text-[#6B6B6B]">—</span>
                        )}
                      </td>
                      {/* Status */}
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                          p.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                        }`}>
                          {p.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      {/* Created At */}
                      <td className="px-3 py-3 text-[#6B6B6B] whitespace-nowrap text-xs">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </td>
                      {/* Updated At */}
                      <td className="px-3 py-3 text-[#6B6B6B] whitespace-nowrap text-xs">
                        {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </td>
                      {/* Actions */}
                      <td className="px-3 py-3 text-right">
                        <div className="flex justify-end items-center gap-1">
                          <button onClick={() => openDetail(p)} title="View"
                            className="p-1.5 rounded hover:bg-[#F0F0F0] text-[#6B6B6B] text-sm">👁</button>
                          <button onClick={() => openEdit(p)} title="Edit"
                            className="p-1.5 rounded hover:bg-[#F0F0F0] text-[#1A1A1A] text-sm">✎</button>
                          <button onClick={() => handleToggle(p.id)}
                            title={p.isActive ? "Deactivate" : "Activate"}
                            className={`p-1.5 rounded hover:bg-[#F0F0F0] text-sm ${
                              p.isActive ? "text-[#D4AF37]" : "text-[#6B6B6B]"
                            }`}>
                            {p.isActive ? "✓" : "✕"}
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
                    className="px-3 py-1 rounded border border-[#E5E5E5] disabled:opacity-40 hover:bg-[#F9F9F9]">
                    Previous
                  </button>
                  <button onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={!pagination.hasNext}
                    className="px-3 py-1 rounded border border-[#E5E5E5] disabled:opacity-40 hover:bg-[#F9F9F9]">
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ════════════════════ CREATE / EDIT MODAL ═══════════════════════════ */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-8">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5]">
              <h2 className="text-xl font-heading">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-[#6B6B6B] hover:text-[#1A1A1A] text-xl leading-none">✕</button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#E5E5E5] px-6 overflow-x-auto gap-1">
              {(["basic", "descriptions", "specifications", "ingredients", "howToUse", "safetyInformation"] as const).map((tab) => {
                const label = tab === "howToUse" ? "How to Use" : tab === "safetyInformation" ? "Safety Info" : tab;
                const count = tab === "ingredients" ? form.ingredients.length
                  : tab === "descriptions" ? form.productDescriptions.filter(d => d.content).length
                  : tab === "specifications" ? form.specifications.length
                  : tab === "howToUse" ? form.howToUse.filter(s => s.trim()).length
                  : tab === "safetyInformation" ? form.safetyInformation.filter(s => s.trim()).length
                  : 0;
                return (
                  <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === tab
                        ? "border-[#D4AF37] text-[#D4AF37]"
                        : "border-transparent text-[#6B6B6B] hover:text-[#1A1A1A]"
                    }`}>
                    {label}
                    {count > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] text-xs rounded-full">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 max-h-[62vh] overflow-y-auto space-y-5">

                {/* ── BASIC ──────────────────────────────────────────────── */}
                {activeTab === "basic" && (
                  <>
                    {/* Image */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Product Image</label>
                      <div className="flex items-start gap-4">
                        <div className="shrink-0">
                          <ProductImage 
                            src={imagePreview} 
                            alt="Preview" 
                            width={80} 
                            height={80}
                            className="w-20 h-20 object-cover rounded border border-[#E5E5E5]" 
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <input type="file" accept="image/*" onChange={handleImageChange}
                            className="w-full text-sm text-[#6B6B6B] file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-[#D4AF37] file:text-white hover:file:bg-[#b8952e]" />
                          <p className="text-xs text-[#6B6B6B]">or paste a URL:</p>
                          <input type="text" placeholder="https://..."
                            value={form.imageUrl}
                            onChange={(e) => { setField("imageUrl", e.target.value); setField("imageFile", null); setImagePreview(e.target.value || null); }}
                            className="w-full rounded border border-[#E5E5E5] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" />
                        </div>
                      </div>
                    </div>

                    {/* Gallery Images */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Gallery Images (Additional Views)</label>

                      {/* File upload */}
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setField("galleryFiles", [...form.galleryFiles, ...files]);
                          const newPreviews = files.map(f => URL.createObjectURL(f));
                          setGalleryPreviews([...form.existingGallery, ...form.galleryFiles.map(f => URL.createObjectURL(f)), ...newPreviews]);
                        }}
                        className="w-full text-sm text-[#6B6B6B] file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-[#D4AF37] file:text-white hover:file:bg-[#b8952e] mb-2" 
                      />

                      {/* URL input */}
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          placeholder="Paste image URL (e.g. from Google Images)..."
                          value={galleryUrlInput}
                          onChange={(e) => setGalleryUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const trimmed = galleryUrlInput.trim();
                              if (!trimmed) return;
                              const newExisting = [...form.existingGallery, trimmed];
                              setField("existingGallery", newExisting);
                              setGalleryPreviews([...newExisting, ...form.galleryFiles.map(f => URL.createObjectURL(f))]);
                              setGalleryUrlInput("");
                            }
                          }}
                          className="flex-1 rounded border border-[#E5E5E5] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = galleryUrlInput.trim();
                            if (!trimmed) return;
                            const newExisting = [...form.existingGallery, trimmed];
                            setField("existingGallery", newExisting);
                            setGalleryPreviews([...newExisting, ...form.galleryFiles.map(f => URL.createObjectURL(f))]);
                            setGalleryUrlInput("");
                          }}
                          className="px-3 py-1.5 rounded bg-[#1A1A1A] text-white text-sm hover:bg-[#333] transition-colors whitespace-nowrap"
                        >
                          + Add URL
                        </button>
                      </div>

                      {/* Thumbnails preview */}
                      {galleryPreviews.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {galleryPreviews.map((url, idx) => (
                            <div key={idx} className="relative group">
                              <ProductImage 
                                src={url}
                                alt={`Gallery ${idx + 1}`}
                                width={60}
                                height={60}
                                className="w-15 h-15 object-cover rounded border border-[#E5E5E5]"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const isExisting = idx < form.existingGallery.length;
                                  if (isExisting) {
                                    const newExisting = form.existingGallery.filter((_, i) => i !== idx);
                                    setField("existingGallery", newExisting);
                                    setGalleryPreviews([...newExisting, ...form.galleryFiles.map(f => URL.createObjectURL(f))]);
                                  } else {
                                    const fileIdx = idx - form.existingGallery.length;
                                    const newFiles = form.galleryFiles.filter((_, i) => i !== fileIdx);
                                    setField("galleryFiles", newFiles);
                                    setGalleryPreviews([...form.existingGallery, ...newFiles.map(f => URL.createObjectURL(f))]);
                                  }
                                }}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-[#9CA3AF] mt-2">
                        Upload files or paste image URLs (Google Images, etc.) • Press Enter or click "+ Add URL" to add
                      </p>
                    </div>

                    {/* Category + Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <select required value={form.categoryId}
                          onChange={(e) => setField("categoryId", e.target.value)}
                          className="w-full rounded border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]">
                          <option value="">Select category</option>
                          {allCategories.map((c) => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Product Name <span className="text-red-500">*</span>
                        </label>
                        <input required type="text" value={form.productName}
                          onChange={(e) => setField("productName", e.target.value)}
                          placeholder="e.g. Paracetamol 500mg"
                          className="w-full rounded border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" />
                      </div>
                    </div>

                    {/* Dosage Form · Strength · Pack Size · Unit Type */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {([
                        { key: "dosageForm",  label: "Dosage Form",  placeholder: "Tablet" },
                        { key: "strength",    label: "Strength",     placeholder: "500mg"  },
                        { key: "packSize",    label: "Pack Size",    placeholder: "10"     },
                        { key: "unitType",    label: "Unit Type",    placeholder: "Strips" },
                      ] as { key: keyof typeof BLANK_FORM; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <label className="block text-sm font-medium mb-1">
                            {label} <span className="text-red-500">*</span>
                          </label>
                          <input required type="text"
                            value={form[key] as string}
                            onChange={(e) => setField(key, e.target.value)}
                            placeholder={placeholder}
                            className="w-full rounded border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" />
                        </div>
                      ))}
                    </div>

                    {/* Selling Price · Original Price · Tax · Discount */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {([
                        { key: "sellingPrice",  label: "Selling Price",  required: true  },
                        { key: "originalPrice", label: "Original Price", required: true  },
                        { key: "tax",           label: "Tax (%)",        required: false },
                        { key: "discount",      label: "Discount (%)",   required: false },
                      ] as { key: keyof typeof BLANK_FORM; label: string; required: boolean }[]).map(({ key, label, required }) => (
                        <div key={key}>
                          <label className="block text-sm font-medium mb-1">
                            {label}{required && <span className="text-red-500"> *</span>}
                          </label>
                          <input type="number" min="0" step="0.01"
                            required={required}
                            value={form[key] as string}
                            onChange={(e) => setField(key, e.target.value)}
                            className="w-full rounded border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" />
                        </div>
                      ))}
                    </div>

                    {/* Suitable For */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Suitable For</label>
                      <div className="flex flex-wrap gap-2">
                        {SUITABLE_FOR_OPTIONS.map((tag) => (
                          <button key={tag} type="button" onClick={() => toggleSuitable(tag)}
                            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                              form.suitableFor.includes(tag)
                                ? "bg-[#D4AF37] border-[#D4AF37] text-white"
                                : "border-[#E5E5E5] text-[#6B6B6B] hover:border-[#D4AF37] hover:text-[#D4AF37]"
                            }`}>
                            {tag.replace(/_/g, " ")}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* isActive */}
                    <div className="flex items-center gap-2">
                      <input id="isActive" type="checkbox"
                        checked={form.isActive}
                        onChange={(e) => setField("isActive", e.target.checked)}
                        className="w-4 h-4 text-[#D4AF37] border-[#E5E5E5] rounded focus:ring-[#D4AF37]" />
                      <label htmlFor="isActive" className="text-sm">Active (visible in store)</label>
                    </div>
                  </>
                )}

                {/* ── DESCRIPTIONS ───────────────────────────────────────── */}
                {activeTab === "descriptions" && (
                  <div className="space-y-4">
                    <p className="text-xs text-[#6B6B6B]">
                      The first section is the main product description. Add extra sections for Side Effects, Storage, etc.
                    </p>
                    {form.productDescriptions.map((desc, i) => (
                      <div key={i} className="border border-[#E5E5E5] rounded-md p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-[#1A1A1A]">
                            {i === 0 ? "Main Description" : `Section ${i + 1}`}
                          </span>
                          {i > 0 && (
                            <button type="button" onClick={() => removeDescription(i)}
                              className="text-xs text-red-500 hover:text-red-700">Remove</button>
                          )}
                        </div>
                        {/* First section: no title input — it's always the main description */}
                        {i === 0 ? (
                          <p className="text-[11px] text-[#9CA3AF] font-sans">
                            This is the main product description shown on the product page.
                          </p>
                        ) : (
                          <input type="text" placeholder="Section title (e.g. Side Effects, Storage)"
                            value={desc.title}
                            onChange={(e) => updateDescription(i, "title", e.target.value)}
                            className="w-full rounded border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" />
                        )}
                        <textarea rows={3} placeholder={i === 0 ? "Main product description..." : "Section content..."}
                          value={desc.content}
                          onChange={(e) => updateDescription(i, "content", e.target.value)}
                          className="w-full rounded border border-[#E5E5E5] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" />
                      </div>
                    ))}
                    <button type="button" onClick={addDescription}
                      className="text-sm text-[#D4AF37] hover:text-[#b8952e] font-medium">
                      + Add section
                    </button>
                  </div>
                )}

                {/* ── SPECIFICATIONS ──────────────────────────────────────── */}
                {activeTab === "specifications" && (
                  <div className="space-y-3">
                    <p className="text-xs text-[#6B6B6B]">
                      Key / value pairs — Manufacturer, Country of Origin, Shelf Life, etc.
                    </p>
                    {form.specifications.length === 0 && (
                      <p className="text-sm text-[#6B6B6B] py-3 text-center">No specifications yet.</p>
                    )}
                    {form.specifications.map((spec, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <input type="text" placeholder="Key (e.g. Manufacturer)"
                          value={spec.key} onChange={(e) => updateSpec(i, "key", e.target.value)}
                          className="flex-1 rounded border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" />
                        <input type="text" placeholder="Value (e.g. PharmaCo Ltd)"
                          value={spec.value} onChange={(e) => updateSpec(i, "value", e.target.value)}
                          className="flex-1 rounded border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" />
                        <button type="button" onClick={() => removeSpec(i)}
                          className="text-red-500 hover:text-red-700 px-1 text-sm shrink-0">✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={addSpec}
                      className="text-sm text-[#D4AF37] hover:text-[#b8952e] font-medium">
                      + Add specification
                    </button>
                  </div>
                )}

                {/* ── INGREDIENTS ─────────────────────────────────────────── */}
                {activeTab === "ingredients" && (                  <div className="space-y-3">
                    <p className="text-xs text-[#6B6B6B]">
                      List each ingredient with an optional quantity and unit (e.g. 500 mg).
                    </p>
                    {form.ingredients.length === 0 && (
                      <p className="text-sm text-[#6B6B6B] py-3 text-center">No ingredients added yet.</p>
                    )}
                    {/* Header row */}
                    {form.ingredients.length > 0 && (
                      <div className="grid grid-cols-[24px_1fr_80px_80px_32px] gap-2 px-1">
                        <span />
                        <span className="text-xs font-medium text-[#6B6B6B]">Ingredient Name</span>
                        <span className="text-xs font-medium text-[#6B6B6B]">Quantity</span>
                        <span className="text-xs font-medium text-[#6B6B6B]">Unit</span>
                        <span />
                      </div>
                    )}
                    {form.ingredients.map((ing, i) => (
                      <div key={i} className="grid grid-cols-[24px_1fr_80px_80px_32px] items-center gap-2">
                        <span className="text-xs text-[#6B6B6B] text-right">{i + 1}.</span>
                        <input type="text" placeholder="e.g. Paracetamol"
                          value={ing.ingredientName}
                          onChange={(e) => updateIngredient(i, "ingredientName", e.target.value)}
                          className="rounded border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" />
                        <input type="text" placeholder="500"
                          value={ing.quantity}
                          onChange={(e) => updateIngredient(i, "quantity", e.target.value)}
                          className="rounded border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" />
                        <input type="text" placeholder="mg"
                          value={ing.unit}
                          onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                          className="rounded border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" />
                        <button type="button" onClick={() => removeIngredient(i)}
                          className="text-red-500 hover:text-red-700 text-sm">✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={addIngredient}
                      className="text-sm text-[#D4AF37] hover:text-[#b8952e] font-medium">
                      + Add ingredient
                    </button>
                  </div>
                )}

                {/* ── HOW TO USE ──────────────────────────────────────────── */}
                {activeTab === "howToUse" && (
                  <div className="space-y-3">
                    <p className="text-xs text-[#6B6B6B]">
                      Add step-by-step instructions. Each entry appears as a separate point on the product page.
                    </p>
                    {form.howToUse.length === 0 && (
                      <p className="text-sm text-[#6B6B6B] py-3 text-center">No steps added yet.</p>
                    )}
                    {form.howToUse.map((step, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-xs text-[#9CA3AF] font-medium mt-2.5 w-5 flex-shrink-0">{i + 1}.</span>
                        <textarea rows={2} placeholder="e.g. Apply a small amount to affected area twice daily."
                          value={step}
                          onChange={(e) => {
                            const updated = [...form.howToUse];
                            updated[i] = e.target.value;
                            setField("howToUse", updated);
                          }}
                          className="flex-1 rounded border border-[#E5E5E5] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" />
                        <button type="button" onClick={() => setField("howToUse", form.howToUse.filter((_, idx) => idx !== i))}
                          className="text-red-500 hover:text-red-700 mt-2 text-sm flex-shrink-0">✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setField("howToUse", [...form.howToUse, ""])}
                      className="text-sm text-[#D4AF37] hover:text-[#b8952e] font-medium">
                      + Add step
                    </button>
                  </div>
                )}

                {/* ── SAFETY INFORMATION ──────────────────────────────────── */}
                {activeTab === "safetyInformation" && (
                  <div className="space-y-3">
                    <p className="text-xs text-[#6B6B6B]">
                      Add safety warnings, contraindications, and storage instructions. Each entry is a separate point.
                    </p>
                    {form.safetyInformation.length === 0 && (
                      <p className="text-sm text-[#6B6B6B] py-3 text-center">No safety information added yet.</p>
                    )}
                    {form.safetyInformation.map((info, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-xs text-[#9CA3AF] font-medium mt-2.5 w-5 flex-shrink-0">•</span>
                        <textarea rows={2} placeholder="e.g. Keep out of reach of children."
                          value={info}
                          onChange={(e) => {
                            const updated = [...form.safetyInformation];
                            updated[i] = e.target.value;
                            setField("safetyInformation", updated);
                          }}
                          className="flex-1 rounded border border-[#E5E5E5] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" />
                        <button type="button" onClick={() => setField("safetyInformation", form.safetyInformation.filter((_, idx) => idx !== i))}
                          className="text-red-500 hover:text-red-700 mt-2 text-sm flex-shrink-0">✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setField("safetyInformation", [...form.safetyInformation, ""])}
                      className="text-sm text-[#D4AF37] hover:text-[#b8952e] font-medium">
                      + Add point
                    </button>
                  </div>
                )}

              </div>

              {/* Modal footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#E5E5E5]">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded border border-[#E5E5E5] text-sm font-medium hover:bg-[#F9F9F9]">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="px-4 py-2 rounded bg-[#D4AF37] text-white text-sm font-medium hover:bg-[#b8952e] disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════ DETAIL MODAL ══════════════════════════════════ */}
      {detailOpen && detailProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5]">
              <h2 className="text-xl font-heading truncate">{detailProduct.productName}</h2>
              <button onClick={() => setDetailOpen(false)} className="text-[#6B6B6B] hover:text-[#1A1A1A] text-xl shrink-0 ml-4">✕</button>
            </div>
            <div className="px-6 py-5 space-y-6 max-h-[72vh] overflow-y-auto">

              <ProductImage 
                src={detailProduct.productImage} 
                alt={detailProduct.productName}
                width={120} 
                height={120}
                className="w-28 h-28 object-cover rounded-lg border border-[#E5E5E5]" 
              />

              {/* Core fields grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                {[
                  ["Category",        detailProduct.category?.categoryName || "—"],
                  ["Dosage Form",     detailProduct.dosageForm],
                  ["Strength",        detailProduct.strength],
                  ["Pack Size",       detailProduct.packSize],
                  ["Unit Type",       detailProduct.unitType],
                  ["Selling Price",   `£${Number(detailProduct.sellingPrice).toFixed(2)}`],
                  ["Original Price",  `£${Number(detailProduct.originalPrice).toFixed(2)}`],
                  ["Tax",             `${detailProduct.tax}%`],
                  ["Discount",        `${detailProduct.discount}%`],
                  ["Status",          detailProduct.isActive ? "Active" : "Inactive"],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-xs text-[#6B6B6B] mb-0.5">{label}</p>
                    <p className="font-medium">{val}</p>
                  </div>
                ))}
              </div>

              {/* Suitable For */}
              {detailProduct.suitableFor?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Suitable For</p>
                  <div className="flex flex-wrap gap-2">
                    {detailProduct.suitableFor.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-[#D4AF37]/10 text-[#D4AF37] text-xs rounded-full">
                        {tag.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Ingredients */}
              {detailProduct.ingredients && detailProduct.ingredients.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">
                    Ingredients ({detailProduct.ingredients.length})
                  </p>
                  <div className="rounded border border-[#E5E5E5] overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-[#F9F9F9]">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-[#6B6B6B]">#</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-[#6B6B6B]">Name</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-[#6B6B6B]">Quantity</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-[#6B6B6B]">Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailProduct.ingredients.map((ing, i) => (
                          <tr key={ing.id || i} className="border-t border-[#E5E5E5]">
                            <td className="px-3 py-2 text-[#6B6B6B]">{i + 1}</td>
                            <td className="px-3 py-2 font-medium">{ing.ingredientName}</td>
                            <td className="px-3 py-2 text-[#6B6B6B]">{ing.quantity || "—"}</td>
                            <td className="px-3 py-2 text-[#6B6B6B]">{ing.unit || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Descriptions */}
              {detailProduct.productDescriptions?.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Descriptions</p>
                  {detailProduct.productDescriptions.map((d, i) => (
                    <div key={i} className="border-l-2 border-[#D4AF37] pl-3">
                      {d.title && <p className="text-sm font-medium">{d.title}</p>}
                      <p className="text-sm text-[#6B6B6B] mt-0.5 whitespace-pre-wrap">{d.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Specifications */}
              {detailProduct.specifications?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Specifications</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {detailProduct.specifications.map((s, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-[#6B6B6B] shrink-0">{s.key}:</span>
                        <span className="font-medium">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#E5E5E5]">
              <button onClick={() => { setDetailOpen(false); openEdit(detailProduct); }}
                className="px-4 py-2 rounded bg-[#D4AF37] text-white text-sm font-medium hover:bg-[#b8952e]">
                Edit Product
              </button>
              <button onClick={() => setDetailOpen(false)}
                className="px-4 py-2 rounded border border-[#E5E5E5] text-sm font-medium hover:bg-[#F9F9F9]">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ BULK IMPORT MODAL ═════════════════════════════ */}
      {bulkOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading">Bulk Import Products</h2>
              <button onClick={() => setBulkOpen(false)} className="text-[#6B6B6B] hover:text-[#1A1A1A] text-xl">✕</button>
            </div>
            <p className="text-sm text-[#6B6B6B] mb-4">
              Required columns: <strong>categoryId, productName, dosageForm, strength, packSize, unitType, sellingPrice, originalPrice</strong>.<br />
              Optional: tax, discount, imageUrl, suitableFor, isActive, ingredients (JSON string).
            </p>
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Upload Excel (.xlsx / .xls)</label>
                <input type="file" accept=".xlsx,.xls"
                  onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-[#6B6B6B] file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-[#D4AF37] file:text-white hover:file:bg-[#b8952e]" />
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E5E5E5]" /></div>
                <div className="relative flex justify-center"><span className="px-2 bg-white text-[#6B6B6B] text-sm">OR</span></div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Paste JSON Array</label>
                <textarea rows={5} value={bulkJson}
                  onChange={(e) => setBulkJson(e.target.value)}
                  placeholder='[{"categoryId":"...","productName":"Paracetamol","dosageForm":"Tablet","strength":"500mg","packSize":"10","unitType":"Strips","sellingPrice":50,"originalPrice":60}]'
                  className="w-full rounded border border-[#E5E5E5] px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" />
              </div>
              {bulkResult && (
                <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                  <p className="font-medium text-green-800">Import complete</p>
                  <ul className="mt-1 text-green-700 space-y-0.5">
                    <li>Total: {bulkResult.summary?.total}</li>
                    <li>Created: {bulkResult.summary?.created}</li>
                    <li>Failed: {bulkResult.summary?.failed}</li>
                    {bulkResult.errors?.length > 0 && (
                      <li>Errors: {bulkResult.errors.map((e: any) => `Row ${e.row}: ${e.reason}`).join(" · ")}</li>
                    )}
                  </ul>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setBulkOpen(false)}
                  className="px-4 py-2 rounded border border-[#E5E5E5] text-sm font-medium hover:bg-[#F9F9F9]">
                  Close
                </button>
                <button type="submit" disabled={bulkSubmitting}
                  className="px-4 py-2 rounded bg-[#D4AF37] text-white text-sm font-medium hover:bg-[#b8952e] disabled:opacity-50 disabled:cursor-not-allowed">
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
