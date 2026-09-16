"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import ProductImage from "@/components/ui/ProductImage";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  productName: string;
  productImage: string | null;
  sellingPrice: number;
  originalPrice: number;
  discount: number;
  unitType: string;
  packSize: string;
  isActive: boolean;
  category?: { id: string; categoryName: string };
}

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1 mb-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star key={star} className="w-3 h-3"
            fill={star <= Math.round(rating) ? "var(--color-primary)" : "none"}
            stroke={star <= Math.round(rating) ? "var(--color-primary)" : "#d1d5db"}
            strokeWidth={1.5}
          />
        ))}
      </div>
      <span className="text-[10px] text-gray-400 font-sans">({count})</span>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product, index }: { product: Product; index: number }) {
  const { data: session } = useSession();
  const { addToCart, items, updateQty } = useCart();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [reviewStats, setReviewStats] = useState({ rating: 0, count: 0 });

  const user = session?.user as { id?: string; role?: string } | undefined;
  const isCustomer = !!user?.id && user?.role === "CUSTOMER";

  const cartItem = items.find(i => i.id === product.id);
  const inCart   = !!cartItem;
  const price    = Number(product.sellingPrice);

  // Check wishlist
  useEffect(() => {
    if (!user?.id || !isCustomer) return;
    fetch(`/api/wishlist?customerId=${user.id}&productId=${product.id}`)
      .then(r => r.json())
      .then(json => { if (json.success) setIsInWishlist((json.data ?? []).length > 0); })
      .catch(() => {});
  }, [user?.id, isCustomer, product.id]);

  // Fetch review stats
  useEffect(() => {
    fetch(`/api/reviews?productId=${product.id}&isApproved=true&limit=1`)
      .then(r => r.json())
      .then(json => {
        if (json.success && json.stats) {
          setReviewStats({ rating: json.stats.averageRating ?? 0, count: json.stats.totalReviews ?? 0 });
        }
      })
      .catch(() => {});
  }, [product.id]);

  async function toggleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isCustomer) { toast.error("Please sign in as a customer to use wishlist"); return; }
    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        const res = await fetch(`/api/wishlist?customerId=${user!.id}&productId=${product.id}`);
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          const delRes = await fetch(`/api/wishlist/${json.data[0].id}`, { method: "DELETE" });
          const delJson = await delRes.json();
          if (!delRes.ok || !delJson.success) throw new Error(delJson.message || "Failed to remove");
          setIsInWishlist(false);
          toast.success("Removed from wishlist");
        }
      } else {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerId: user!.id, productId: product.id }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Failed to add");
        setIsInWishlist(true);
        toast.success("Added to wishlist");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Wishlist update failed");
    } finally {
      setWishlistLoading(false);
    }
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({ id: product.id, name: product.productName, price, image: product.productImage ?? "", category: product.category?.categoryName ?? "" });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1500);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({ id: product.id, name: product.productName, price, image: product.productImage ?? "", category: product.category?.categoryName ?? "" });
    window.location.href = `/pharmacy/${product.id}`;
  };

  const badge = product.discount > 0 ? `-${product.discount}%` : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.09, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="bg-[#F5F3EF] border rounded-2xl overflow-hidden group transition-all duration-200 shadow-[0_8px_32px_rgba(0,0,0,0.35)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      style={{ borderColor: "#D4CEC4" }}
    >
      {/* Image */}
      <Link href={`/pharmacy/${product.id}`} className="block relative aspect-square overflow-hidden bg-[#F5F3EF] rounded-2xl group">
        {badge && (
          <span className="absolute top-2 left-2 z-10 text-white text-[10px] font-semibold px-2 py-0.5 rounded-sm uppercase tracking-wide bg-[#c0392b]">
            {badge}
          </span>
        )}

        {/* Wishlist button */}
        <button onClick={toggleWishlist} disabled={wishlistLoading}
          className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm hover:shadow-md transition-all disabled:opacity-50">
          <Heart className="w-4 h-4" fill={isInWishlist ? "var(--color-primary)" : "none"} stroke={isInWishlist ? "var(--color-primary)" : "#bbb"} strokeWidth={2} />
        </button>

        {/* Action buttons - bottom right */}
        <div className="absolute bottom-2 right-2 z-10 flex items-center gap-2">
          <button
            onClick={handleAddToCart}
            className="w-10 h-10 flex items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-110"
            style={{ backgroundColor: "var(--color-primary)" }}
            title="Add to Cart"
          >
            {addedFeedback
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              : <ShoppingCart className="w-5 h-5 text-white" strokeWidth={2.5} />
            }
          </button>

          <button
            onClick={handleBuyNow}
            className="px-4 h-10 flex items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-105"
            style={{ backgroundColor: "var(--color-text-heading)" }}
            title="Buy Now"
          >
            <span className="text-white text-xs font-bold uppercase">Buy</span>
          </button>
        </div>

        <div className="w-full h-full group-hover:scale-115 transition-transform duration-500">
          <ProductImage src={product.productImage} alt={product.productName} fill
            className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
        </div>
      </Link>

      {/* Info */}
      <div className="p-4 flex flex-col">
        {/* Name + Category */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <Link href={`/pharmacy/${product.id}`}
            className="text-sm font-semibold font-sans hover:underline truncate leading-snug flex-1 block overflow-hidden whitespace-nowrap"
            style={{ color: "var(--color-text-heading)" }}
            title={product.productName}>
            {product.productName}
          </Link>
          {product.category?.categoryName && (
            <span className="text-[9px] uppercase tracking-wider text-white font-sans flex-shrink-0 px-1.5 py-0.5 rounded-full mt-0.5"
              style={{ backgroundColor: "var(--color-primary)", opacity: 0.85 }}>
              {product.category.categoryName}
            </span>
          )}
        </div>

        {/* Stars */}
        <StarRating rating={reviewStats.rating} count={reviewStats.count} />

        {/* In Stock */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
          <span className="text-[11px] text-green-700 font-sans">In Stock</span>
        </div>

        {/* Price */}
        <div className="mb-2 flex items-baseline gap-2">
          <p className="text-lg font-heading font-bold" style={{ color: "var(--color-text-heading)" }}>
            £{price.toFixed(2)}
          </p>
          {Number(product.originalPrice) > price && (
            <p className="text-sm text-red-500 line-through font-sans">
              £{Number(product.originalPrice).toFixed(2)}
            </p>
          )}
          <span className="text-[11px] text-[#9CA3AF] font-sans">
            / {product.packSize} {product.unitType}
          </span>
        </div>

        {/* Cart qty controls */}
        {inCart && (
          <div className="flex items-center gap-2 mt-1">
            <button onClick={() => updateQty(product.id, (cartItem?.quantity ?? 1) - 1)}
              className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 text-sm font-bold leading-none flex-shrink-0"
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.color = "var(--color-primary)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.color = ""; }}>
              −
            </button>
            <span className="text-xs font-semibold text-gray-700 flex-1 text-center">{cartItem?.quantity} in cart</span>
            <button onClick={() => updateQty(product.id, (cartItem?.quantity ?? 0) + 1)}
              className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 text-sm font-bold leading-none flex-shrink-0"
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.color = "var(--color-primary)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.color = ""; }}>
              +
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="bg-[#F5F3EF] border border-[#D4CEC4] rounded-lg overflow-hidden animate-pulse"
    >
      <div className="w-full aspect-square bg-[#E8E4DC]" />
      <div className="px-4 pt-3 pb-4 space-y-2.5">
        <div className="h-4 w-3/4 bg-[#D4CEC4] rounded" />
        <div className="h-3 w-20 bg-[#D4CEC4] rounded" />
        <div className="h-3 w-16 bg-[#D4CEC4] rounded" />
        <div className="h-4 w-1/2 bg-[#D4CEC4] rounded" />
      </div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BestSellers() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetch("/api/products?isActive=true&limit=4")
      .then(r => r.json())
      .then(json => { if (json.success) setProducts(json.data ?? []); })
      .catch(err => console.error("BestSellers load error:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-6" style={{ backgroundColor: "transparent" }}>
      <div className="w-full px-12">

        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B6B6B] font-sans font-semibold mb-1">
              Top Selling
            </p>
            <h2 className="font-heading text-3xl text-[#1A1A1A]">Our Most Selling Products</h2>
            <p className="text-sm text-[#6B6B6B] font-sans mt-1">Curated essentials for your daily wellness.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Link href="/pharmacy"
              className="text-xs text-[#1A1A1A] font-sans tracking-wide hover:text-[#D4AF37] transition-colors hover:underline underline-offset-4">
              View All →
            </Link>
          </motion.div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} index={i} />)
            : products.slice(0, 4).map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))
          }
        </div>

        {!loading && products.length === 0 && (
          <p className="text-center text-sm text-[#9CA3AF] font-sans py-10">
            No products available yet.
          </p>
        )}
      </div>
    </section>
  );
}
