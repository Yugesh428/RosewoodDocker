"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Heart, ChevronDown, ChevronLeft, ChevronRight,
  LayoutGrid, ShoppingCart, Zap as BuyNow, Star, Check,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import ProductImage from "@/components/ui/ProductImage";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DBCategory {
  id: string;
  categoryName: string;
  isActive: boolean;
  parentId: string | null;
}

interface DBProduct {
  id: string;
  categoryId: string;
  productName: string;
  productImage: string | null;
  sellingPrice: number;
  originalPrice: number;
  discount: number;
  isActive: boolean;
  category?: { id: string; categoryName: string };
}

interface PharmacyClientProps {
  categories: DBCategory[];
  products: DBProduct[];
}

const SORT_OPTIONS = [
  { label: "Recommended",       value: "recommended" },
  { label: "Price: Low → High", value: "price_asc"   },
  { label: "Price: High → Low", value: "price_desc"  },
];

const PER_PAGE = 8;

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
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

function ProductCard({ product, highlight = false }: { product: DBProduct; highlight?: boolean }) {
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

  // Check if product is in wishlist
  useEffect(() => {
    if (!user?.id || !isCustomer) return;
    fetch(`/api/wishlist?customerId=${user.id}&productId=${product.id}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setIsInWishlist((json.data ?? []).length > 0);
        }
      })
      .catch(() => {});
  }, [user?.id, isCustomer, product.id]);

  // Fetch review stats for this product
  useEffect(() => {
    fetch(`/api/reviews?productId=${product.id}&isApproved=true&limit=1`)
      .then(r => r.json())
      .then(json => {
        if (json.success && json.stats) {
          setReviewStats({
            rating: json.stats.averageRating ?? 0,
            count: json.stats.totalReviews ?? 0,
          });
        }
      })
      .catch(() => {});
  }, [product.id]);

  // Toggle wishlist
  async function toggleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isCustomer) {
      toast.error("Please sign in as a customer to use wishlist");
      return;
    }
    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        // Remove from wishlist
        const res = await fetch(`/api/wishlist?customerId=${user!.id}&productId=${product.id}`);
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          const wishlistItem = json.data[0];
          const delRes = await fetch(`/api/wishlist/${wishlistItem.id}`, { method: "DELETE" });
          const delJson = await delRes.json();
          if (!delRes.ok || !delJson.success) throw new Error(delJson.message || "Failed to remove");
          setIsInWishlist(false);
          toast.success("Removed from wishlist");
        }
      } else {
        // Add to wishlist
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

  const handleAddToCart = () => {
    addToCart({ id: product.id, name: product.productName, price, image: product.productImage ?? "", category: product.category?.categoryName ?? "" });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1500);
  };
  const handleBuyNow = () => {
    addToCart({ id: product.id, name: product.productName, price, image: product.productImage ?? "", category: product.category?.categoryName ?? "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const badge = product.discount > 0 ? `-${product.discount}%` : null;

  return (
    <div className={`bg-[#F5F3EF] border rounded-2xl overflow-hidden group transition-all duration-200 ${
      highlight ? "" : "shadow-[0_8px_32px_rgba(0,0,0,0.35)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
    }`}
    style={highlight
      ? { borderColor: "var(--color-primary)", boxShadow: `0 0 0 2px color-mix(in srgb, var(--color-primary) 35%, transparent)` }
      : { borderColor: "#D4CEC4" }}>

      {/* Image — clicking navigates to product detail */}
      <Link href={`/pharmacy/${product.id}`} className="block relative aspect-square overflow-hidden bg-gray-50 rounded-2xl group">
        {badge && (
          <span className="absolute top-2 left-2 z-10 text-white text-[10px] font-semibold px-2 py-0.5 rounded-sm uppercase tracking-wide bg-[#c0392b]">
            {badge}
          </span>
        )}
        
        {/* Wishlist button - top right */}
        <button onClick={toggleWishlist} disabled={wishlistLoading}
          className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm hover:shadow-md transition-all disabled:opacity-50">
          <Heart className="w-4 h-4" fill={isInWishlist ? "var(--color-primary)" : "none"} stroke={isInWishlist ? "var(--color-primary)" : "#bbb"} strokeWidth={2} />
        </button>

        {/* Action buttons - bottom right corner, side by side */}
        <div className="absolute bottom-2 right-2 z-10 flex items-center gap-2">
          {/* Add to Cart button */}
          <button
            onClick={(e) => { e.preventDefault(); handleAddToCart(); }}
            className="w-10 h-10 flex items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-110"
            style={{ backgroundColor: "var(--color-primary)" }}
            title="Add to Cart"
          >
            <ShoppingCart className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>

          {/* Buy Now button */}
          <button
            onClick={(e) => { e.preventDefault(); handleBuyNow(); }}
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
        {/* Product name left, Category right */}
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

        {/* Reviews just below */}
        <div className="mb-2"><StarRating rating={reviewStats.rating} count={reviewStats.count} /></div>

        {/* Price */}
        <div className="mb-2 flex items-baseline gap-2">
          <p className="text-lg font-heading font-bold" style={{ color: "var(--color-text-heading)" }}>£{price.toFixed(2)}</p>
          {Number(product.originalPrice) > price && (
            <p className="text-sm text-red-500 line-through font-sans">£{Number(product.originalPrice).toFixed(2)}</p>
          )}
        </div>

        {inCart && (
          <div className="flex items-center gap-2">
            <button onClick={() => updateQty(product.id, (cartItem?.quantity ?? 1) - 1)}
              className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 transition-colors text-sm font-bold leading-none flex-shrink-0"
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.color = "var(--color-primary)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.color = ""; }}>
              −</button>
            <span className="text-xs font-semibold text-gray-700 flex-1 text-center">{cartItem?.quantity} in cart</span>
            <button onClick={() => updateQty(product.id, (cartItem?.quantity ?? 0) + 1)}
              className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 transition-colors text-sm font-bold leading-none flex-shrink-0"
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.color = "var(--color-primary)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.color = ""; }}>
              +</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PharmacyClient({ categories, products }: PharmacyClientProps) {
  const { totalItems } = useCart();
  const searchParams   = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sort,    setSort]    = useState("recommended");
  const [page,    setPage]    = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cartOpen,    setCartOpen]    = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");

  const urlSearch  = searchParams.get("search")  ?? "";
  const urlProduct = searchParams.get("product") ?? "";

  useEffect(() => {
    if (!urlProduct) return;
    const el = document.getElementById(`product-${urlProduct}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [urlProduct]);

  const categoryList = [
    { id: null, label: "All" },
    ...categories.map(cat => ({ id: cat.id, label: cat.categoryName })),
  ];

  const filtered = products
    .filter(p => !selectedCategory || p.categoryId === selectedCategory)
    .filter(p => {
      const search = catalogSearch || urlSearch;
      if (!search) return true;
      return p.productName.toLowerCase().includes(search.toLowerCase()) ||
        (p.category?.categoryName ?? "").toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => {
      if (sort === "price_asc")  return Number(a.sellingPrice) - Number(b.sellingPrice);
      if (sort === "price_desc") return Number(b.sellingPrice) - Number(a.sellingPrice);
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const resetPage  = () => setPage(1);

  return (
    <div className="min-h-screen bg-[#F9F9F9]" style={{ paddingTop: '80px' }}>

      {/* Hero Header Section - Full Width */}
      <div className="relative bg-gradient-to-r from-[#40916c] to-[#74c69d] py-12 mb-8 overflow-hidden w-screen -mx-[100vw] left-1/2 right-1/2 ml-[calc(-50vw)] mr-[calc(-50vw)]">
        {/* Background pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)'
          }}></div>
        </div>
        
        <div className="w-full px-12 relative z-10">
          <div className="text-center">
            <p className="text-[#D4AF37] text-xs md:text-sm uppercase tracking-[0.2em] mb-3 font-sans font-medium">
              OUR PHARMACY
            </p>
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-white mb-4">
              Medicines & Health Essentials
            </h1>
            <p className="text-white/80 text-sm md:text-base max-w-2xl mx-auto font-sans">
              Explore trusted medicines, wellness products, and health essentials alongside specialty pharmaceutical care.
            </p>
          </div>
        </div>
      </div>

      {/* Floating cart */}
      {totalItems > 0 && (
        <button onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-3 rounded-full text-sm font-semibold shadow-xl transition-all hover:scale-105"
          style={{ background: "var(--color-primary)", color: "var(--color-primary-text)" }}>
          <ShoppingCart className="w-4 h-4" /> Cart · {totalItems}
        </button>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* ── MOBILE: horizontal category strip ─────────────────────────────── */}
      <div className="md:hidden px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
          {categoryList.map(cat => {
            const active = selectedCategory === cat.id;
            return (
              <button key={String(cat.id)}
                onClick={() => { setSelectedCategory(cat.id); resetPage(); }}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                style={active
                  ? { backgroundColor: "var(--color-primary)", color: "var(--color-primary-text)", borderColor: "var(--color-primary)" }
                  : { backgroundColor: "#ffffff", color: "#374151", borderColor: "#D0CBBF" }}>
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full px-12 py-4 md:py-6">

        <div className="flex gap-6">

        {/* ── DESKTOP: sidebar ──────────────────────────────────────────────── */}
        <div className="hidden md:block flex-shrink-0 relative">
          <button type="button" onClick={() => setSidebarOpen(o => !o)}
            className="absolute -right-3.5 top-4 z-20 w-7 h-7 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 transition-all group hover:border-[#D4AF37]">
            <ChevronLeft className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ${sidebarOpen ? "" : "rotate-180"}`} />
          </button>

          <aside className={`overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "w-64 opacity-100" : "w-0 opacity-0 pointer-events-none"}`}>
            <div className="w-64 bg-white rounded-2xl shadow-sm border border-gray-200 p-5 relative overflow-hidden">
              
              {/* Background image with overlay */}
              <div className="absolute inset-0 z-0 opacity-20">
                <img 
                  src="https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=80" 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content with higher z-index */}
              <div className="relative z-10">
              
              {/* Filter header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-bold text-[#1A1A1A] font-sans">Filter</h2>
                {selectedCategory && (
                  <button 
                    onClick={() => { setSelectedCategory(null); resetPage(); }}
                    className="text-sm font-medium text-[#D4AF37] hover:text-[#b8952e] transition-colors font-sans"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Search catalog */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search catalog"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#F9F9F9] border border-[#1A1A1A] text-sm placeholder-gray-400 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 font-sans text-[#1A1A1A]"
                    style={{ borderRadius: '9999px' }}
                  />
                  <svg 
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <circle cx="11" cy="11" r="8" strokeWidth="2"/>
                    <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>

              {/* Category section */}
              <div>
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-4 font-sans">Category</h3>
                
                <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto pr-2 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
                  {categoryList
                    .filter(cat => cat.label.toLowerCase().includes(categorySearch.toLowerCase()))
                    .map((cat) => {
                    const active = selectedCategory === cat.id;
                    
                    return (
                      <label 
                        key={String(cat.id)}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <div className="relative flex items-center justify-center">
                          <input
                            type="radio"
                            name="category"
                            checked={active}
                            onChange={() => { setSelectedCategory(cat.id); resetPage(); }}
                            className="sr-only"
                          />
                          <div 
                            className={`w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                              active 
                                ? 'border-[#D4AF37] bg-[#D4AF37]' 
                                : 'border-[#1A1A1A] bg-white group-hover:border-[#D4AF37]'
                            }`}
                          >
                            {active && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <span className={`text-sm font-medium transition-colors font-sans ${
                          active ? 'text-[#1A1A1A]' : 'text-[#1A1A1A] group-hover:text-[#D4AF37]'
                        }`}>
                          {cat.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              </div>
            </div>
          </aside>
        </div>

        {/* Product area */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <p className="text-sm text-gray-500 font-sans">
              <span className="font-semibold font-heading" style={{ color: "var(--color-text-heading)" }}>{filtered.length}</span> products
              {urlSearch && <span className="ml-1.5"> for <span className="font-medium" style={{ color: "var(--color-text-heading)" }}>&quot;{urlSearch}&quot;</span></span>}
              {selectedCategory && (
                <button onClick={() => { setSelectedCategory(null); resetPage(); }}
                  className="ml-2 text-[11px] hover:underline" style={{ color: "var(--color-primary)" }}>
                  × Clear
                </button>
              )}
            </p>
            <div className="flex items-center gap-2">
            </div>
          </div>

          {/* Grid — 2 cols on mobile, 3 on desktop */}
          {paginated.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-gray-400 font-sans text-sm">No products found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
              {paginated.map(product => (
                <div key={product.id} id={`product-${product.id}`}>
                  <ProductCard product={product} highlight={urlProduct === product.id} />
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-1 flex-wrap">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-sm text-gray-500 disabled:opacity-40 transition-colors"
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.color = "var(--color-primary)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.color = ""; }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
                const active = p === page;
                if (totalPages > 7 && p !== 1 && p !== totalPages && (p < page - 1 || p > page + 1)) {
                  if (p === 2 || p === totalPages - 1) return <span key={p} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>;
                  return null;
                }
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className="w-8 h-8 flex items-center justify-center border rounded-sm text-sm font-medium transition-all"
                    style={active
                      ? { background: "var(--color-primary)", color: "var(--color-primary-text)", borderColor: "var(--color-primary)" }
                      : { borderColor: "#e5e7eb", color: "#6B7280" }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.color = "var(--color-primary)"; }}}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#6B7280"; }}}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-sm text-gray-500 disabled:opacity-40 transition-colors"
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.color = "var(--color-primary)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.color = ""; }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
