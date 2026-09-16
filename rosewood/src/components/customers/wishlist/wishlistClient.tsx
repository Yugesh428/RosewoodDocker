/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Heart, ShoppingCart, Trash2, ArrowLeft } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Product = {
  id: string;
  productName: string;
  productImage: string | null;
  sellingPrice: number;
  originalPrice: number | null;
  discount: number | null;
  isActive: boolean;
  category?: { id: string; categoryName: string };
};

type WishlistItem = {
  id: string;
  customerId: string;
  productId: string;
  product?: Product;
  createdAt: string;
};

type WishlistResponse = {
  success: boolean;
  customer: { id: string; name: string; email: string };
  count: number;
  data: WishlistItem[];
  message?: string;
};

const API_BASE = "/api/wishlist";

// ─── Component ────────────────────────────────────────────────────────────────

export default function WishlistClient() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");

  // ─── Fetch wishlist ──────────────────────────────────────────────────────────

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    try {
      // Get customer ID from session/localStorage or auth context
      // For demo, we'll use a hardcoded ID or get from localStorage
      const customerId =
        localStorage.getItem("customerId") || "demo-customer-id";

      const res = await fetch(`${API_BASE}?customerId=${customerId}`);
      const json: WishlistResponse = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to load wishlist");
      }

      setWishlist(json.data || []);
      setCustomerName(json.customer?.name || "Your");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load wishlist",
      );
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // ─── Remove from wishlist ──────────────────────────────────────────────────

  const handleRemove = async (id: string, productName: string) => {
    if (!confirm(`Remove "${productName}" from your wishlist?`)) return;

    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to remove item");
      }

      toast.success(`Removed "${productName}" from wishlist`);
      // Remove from local state
      setWishlist((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    }
  };

  // ─── Add to cart ─────────────────────────────────────────────────────────────

  const handleAddToCart = (product: Product) => {
    // For demo, just show toast – real implementation would call cart API
    toast.success(`Added "${product.productName}" to cart!`);
    // You would dispatch to your cart store/context here
  };

  // ─── Format currency ──────────────────────────────────────────────────────

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // ─── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ─── Empty state ────────────────────────────────────────────────────────────

  if (wishlist.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 min-h-[60vh]">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/shop"
            className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>

        <div className="text-center py-16">
          <div className="flex justify-center mb-6">
            <Heart className="w-20 h-20 text-[#E5E5E5]" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-heading text-[#1A1A1A] mb-2">
            Your wishlist is empty
          </h2>
          <p className="text-[#6B6B6B] max-w-md mx-auto mb-6">
            Start saving your favorite products by clicking the heart icon on
            any product.
          </p>
          <Link
            href="/shop"
            className="inline-block px-6 py-3 rounded-md bg-[#D4AF37] text-white font-medium hover:bg-[#b8952e] transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  // ─── Render wishlist ──────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading text-[#1A1A1A]">
            {customerName} Wishlist
          </h1>
          <p className="text-[#6B6B6B] text-sm mt-1">
            {wishlist.length} item{wishlist.length !== 1 ? "s" : ""} saved
          </p>
        </div>
        <Link
          href="/shop"
          className="flex items-center gap-2 text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Continue Shopping
        </Link>
      </div>

      {/* Wishlist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {wishlist.map((item) => {
          const product = item.product;
          if (!product) return null;

          return (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-sm border border-[#E5E5E5] overflow-hidden hover:shadow-md transition-shadow group"
            >
              {/* Product Image */}
              <Link href={`/shop/${product.id}`} className="block relative">
                <div className="relative h-56 w-full bg-[#F9F9F9]">
                  {product.productImage ? (
                    <Image
                      src={product.productImage}
                      alt={product.productName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized={product.productImage.startsWith("/uploads/")}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-[#ABABAB] text-sm">
                      No image
                    </div>
                  )}

                  {/* Discount Badge */}
                  {product.discount && product.discount > 0 && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                      {product.discount}% OFF
                    </span>
                  )}
                </div>
              </Link>

              {/* Product Details */}
              <div className="p-4">
                {/* Category */}
                {product.category && (
                  <span className="text-xs text-[#6B6B6B] uppercase tracking-wider">
                    {product.category.categoryName}
                  </span>
                )}

                {/* Product Name */}
                <Link href={`/shop/${product.id}`} className="block mt-1">
                  <h3 className="font-medium text-[#1A1A1A] hover:text-[#D4AF37] transition-colors line-clamp-2">
                    {product.productName}
                  </h3>
                </Link>

                {/* Price */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-lg font-bold text-[#1A1A1A]">
                    {formatCurrency(product.sellingPrice)}
                  </span>
                  {product.originalPrice &&
                    product.originalPrice > product.sellingPrice && (
                      <span className="text-sm text-[#6B6B6B] line-through">
                        {formatCurrency(product.originalPrice)}
                      </span>
                    )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#D4AF37] text-white text-sm font-medium rounded-md hover:bg-[#b8952e] transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                  <button
                    onClick={() => handleRemove(item.id, product.productName)}
                    className="p-2 border border-[#E5E5E5] rounded-md hover:bg-red-50 hover:border-red-200 transition-colors group/remove"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4 text-[#6B6B6B] group-hover/remove:text-red-500 transition-colors" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
