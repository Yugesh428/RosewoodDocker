/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Product = {
  id: string;
  productName: string;
  dosageForm?: string;
  strength?: string;
  packSize?: string;
  unitType?: string;
  category?: { id: string; categoryName: string };
};

type Inventory = {
  id: string;
  productId: string;
  batchNumber: string;
  quantity: number;
  manufacturingDate: string;
  expiryDate: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  supplierName: string;
  lowStockThreshold: number;
  isActive: boolean;
  stockStatus: "in-stock" | "low-stock" | "out-of-stock";
  product?: Product;
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
};

type StockStatusFilter = "in-stock" | "low-stock" | "out-of-stock" | "";

const API_BASE = "/api/inventory";
const PRODUCTS_API = "/api/products";
const PAGE_SIZE = 10;

// ─── Component ────────────────────────────────────────────────────────────────

export default function InventorySection() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [pagination, setPagination] =
    useState<ApiResponse<any>["pagination"]>(undefined);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockStatusFilter>("");
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
    undefined,
  );
  const [currentPage, setCurrentPage] = useState(1);

  // Products list for dropdown
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // ─── Modal states ───────────────────────────────────────────────────────────

  // Create / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [formData, setFormData] = useState({
    productId: "",
    batchNumber: "",
    quantity: 0,
    manufacturingDate: "",
    expiryDate: "",
    purchasePrice: 0,
    sellingPrice: 0,
    mrp: 0,
    supplierName: "",
    lowStockThreshold: 10,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Adjust Stock — removed

  // ─── Fetch inventory ─────────────────────────────────────────────────────────

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(PAGE_SIZE));
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (activeFilter !== undefined)
        params.set("isActive", String(activeFilter));

      const res = await fetch(`${API_BASE}?${params.toString()}`);
      const json: ApiResponse<Inventory[]> = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message || "Failed to fetch inventory");
      setInventory(json.data || []);
      setPagination(json.pagination ?? undefined);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load inventory",
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter, activeFilter]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // ─── Fetch products for dropdown ────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await fetch(`${PRODUCTS_API}?limit=500&isActive=true`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data || []);
      }
    } catch (err) {
      // non-critical
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ─── Modal helpers ──────────────────────────────────────────────────────────

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      productId: "",
      batchNumber: "",
      quantity: 0,
      manufacturingDate: "",
      expiryDate: "",
      purchasePrice: 0,
      sellingPrice: 0,
      mrp: 0,
      supplierName: "",
      lowStockThreshold: 10,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: Inventory) => {
    setEditingItem(item);
    setFormData({
      productId: item.productId,
      batchNumber: item.batchNumber,
      quantity: item.quantity,
      manufacturingDate: item.manufacturingDate.slice(0, 10),
      expiryDate: item.expiryDate.slice(0, 10),
      purchasePrice: Number(item.purchasePrice),
      sellingPrice: Number(item.sellingPrice),
      mrp: Number(item.mrp),
      supplierName: item.supplierName,
      lowStockThreshold: item.lowStockThreshold,
      isActive: item.isActive,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
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
      const isEdit = !!editingItem;
      const url = isEdit ? `${API_BASE}/${editingItem.id}` : API_BASE;
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        productId: formData.productId,
        batchNumber: formData.batchNumber.trim(),
        quantity: Number(formData.quantity),
        manufacturingDate: formData.manufacturingDate,
        expiryDate: formData.expiryDate,
        purchasePrice: Number(formData.purchasePrice),
        sellingPrice: Number(formData.sellingPrice),
        mrp: Number(formData.mrp),
        supplierName: formData.supplierName.trim(),
        lowStockThreshold: Number(formData.lowStockThreshold),
        isActive: formData.isActive,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message || "Operation failed");

      toast.success(isEdit ? "Inventory updated" : "Inventory batch created");
      await fetchInventory();
      closeModal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/${id}/toggle-active`, {
        method: "PATCH",
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message || "Toggle failed");
      toast.success(json.message || "Status toggled");
      await fetchInventory();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Toggle failed");
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  const getStatusColor = (status: Inventory["stockStatus"]) => {
    switch (status) {
      case "in-stock":
        return "bg-green-100 text-green-800";
      case "low-stock":
        return "bg-yellow-100 text-yellow-800";
      case "out-of-stock":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusLabel = (status: Inventory["stockStatus"]) => {
    switch (status) {
      case "in-stock":
        return "In Stock";
      case "low-stock":
        return "Low Stock";
      case "out-of-stock":
        return "Out of Stock";
      default:
        return status;
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 bg-[#F9F9F9] min-h-screen text-[#1A1A1A]">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-heading text-[#1A1A1A]">Inventory</h1>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-md bg-[#D4AF37] text-white text-sm font-medium hover:bg-[#b8952e] transition-colors"
          >
            + Add Batch
          </button>
        </div>

        {/* Search / filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by product name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as StockStatusFilter)
            }
            className="rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value="">All stock status</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
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
              setStatusFilter("");
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
              <table className="w-full text-sm min-w-[1400px]">
                <thead className="bg-[#F9F9F9] border-b border-[#E5E5E5]">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap">
                      Batch
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap hidden sm:table-cell">
                      Mfg Date
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap hidden sm:table-cell">
                      Expiry
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap hidden md:table-cell">
                      Purchase Price
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap hidden md:table-cell">
                      Selling Price
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap hidden lg:table-cell">
                      MRP
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap hidden lg:table-cell">
                      Supplier
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap hidden xl:table-cell">
                      Low Stock
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] whitespace-nowrap">
                      Active
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-[#1A1A1A] whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.length === 0 ? (
                    <tr>
                      <td
                        colSpan={13}
                        className="px-4 py-8 text-center text-[#6B6B6B]"
                      >
                        No inventory records found.
                      </td>
                    </tr>
                  ) : (
                    inventory.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-[#E5E5E5] hover:bg-[#F9F9F9]/50"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium">
                            {item.product?.productName || "—"}
                          </div>
                          <div className="text-xs text-[#6B6B6B]">
                            {item.product?.category?.categoryName || ""}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#6B6B6B] whitespace-nowrap">
                          {item.batchNumber}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(
                              item.stockStatus,
                            )}`}
                          >
                            {getStatusLabel(item.stockStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#6B6B6B] hidden sm:table-cell whitespace-nowrap">
                          {formatDate(item.manufacturingDate)}
                        </td>
                        <td className="px-4 py-3 text-[#6B6B6B] hidden sm:table-cell whitespace-nowrap">
                          {formatDate(item.expiryDate)}
                        </td>
                        <td className="px-4 py-3 text-[#6B6B6B] hidden md:table-cell whitespace-nowrap">
                          {formatCurrency(item.purchasePrice)}
                        </td>
                        <td className="px-4 py-3 text-[#6B6B6B] hidden md:table-cell whitespace-nowrap">
                          {formatCurrency(item.sellingPrice)}
                        </td>
                        <td className="px-4 py-3 text-[#6B6B6B] hidden lg:table-cell whitespace-nowrap">
                          {formatCurrency(item.mrp)}
                        </td>
                        <td className="px-4 py-3 text-[#6B6B6B] hidden lg:table-cell whitespace-nowrap">
                          {item.supplierName}
                        </td>
                        <td className="px-4 py-3 text-[#6B6B6B] hidden xl:table-cell whitespace-nowrap">
                          {item.lowStockThreshold}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full ${
                              item.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {item.isActive ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex justify-center items-center gap-2">
                            <button
                              onClick={() => handleToggleActive(item.id)}
                              className={`p-1 rounded hover:bg-[#F9F9F9] text-sm ${
                                item.isActive
                                  ? "text-[#D4AF37]"
                                  : "text-[#6B6B6B]"
                              }`}
                              title={item.isActive ? "Deactivate" : "Activate"}
                            >
                              {item.isActive ? "✓" : "✕"}
                            </button>
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1 rounded hover:bg-[#F9F9F9] text-[#1A1A1A]"
                              title="Edit"
                            >
                              ✎
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
              {editingItem ? "Edit Batch" : "Add New Batch"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product */}
              <div>
                <label
                  htmlFor="productId"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Product <span className="text-red-500">*</span>
                </label>
                <select
                  id="productId"
                  name="productId"
                  value={formData.productId}
                  onChange={handleFormChange}
                  required
                  disabled={productsLoading}
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.productName} {p.strength && `(${p.strength})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Number */}
              <div>
                <label
                  htmlFor="batchNumber"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Batch Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="batchNumber"
                  name="batchNumber"
                  type="text"
                  value={formData.batchNumber}
                  onChange={handleFormChange}
                  required
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  placeholder="BATCH-001"
                />
              </div>

              {/* Quantity */}
              <div>
                <label
                  htmlFor="quantity"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={handleFormChange}
                  required
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                />
              </div>

              {/* Manufacturing Date */}
              <div>
                <label
                  htmlFor="manufacturingDate"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Manufacturing Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="manufacturingDate"
                  name="manufacturingDate"
                  type="date"
                  value={formData.manufacturingDate}
                  onChange={handleFormChange}
                  required
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label
                  htmlFor="expiryDate"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Expiry Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="expiryDate"
                  name="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={handleFormChange}
                  required
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                />
              </div>

              {/* Purchase Price */}
              <div>
                <label
                  htmlFor="purchasePrice"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Purchase Price <span className="text-red-500">*</span>
                </label>
                <input
                  id="purchasePrice"
                  name="purchasePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.purchasePrice}
                  onChange={handleFormChange}
                  required
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* Selling Price */}
              <div>
                <label
                  htmlFor="sellingPrice"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Selling Price <span className="text-red-500">*</span>
                </label>
                <input
                  id="sellingPrice"
                  name="sellingPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sellingPrice}
                  onChange={handleFormChange}
                  required
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* MRP */}
              <div>
                <label
                  htmlFor="mrp"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  MRP <span className="text-red-500">*</span>
                </label>
                <input
                  id="mrp"
                  name="mrp"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.mrp}
                  onChange={handleFormChange}
                  required
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* Supplier Name */}
              <div>
                <label
                  htmlFor="supplierName"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Supplier Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="supplierName"
                  name="supplierName"
                  type="text"
                  value={formData.supplierName}
                  onChange={handleFormChange}
                  required
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  placeholder="Supplier Inc."
                />
              </div>

              {/* Low Stock Threshold */}
              <div>
                <label
                  htmlFor="lowStockThreshold"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Low Stock Threshold
                </label>
                <input
                  id="lowStockThreshold"
                  name="lowStockThreshold"
                  type="number"
                  min="0"
                  value={formData.lowStockThreshold}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  placeholder="10"
                />
                <p className="text-xs text-[#6B6B6B] mt-1">
                  Quantity below this triggers "Low Stock" status.
                </p>
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
                  {submitting ? "Saving..." : editingItem ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
