"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ChevronRight, ChevronDown, ChevronUp, ShoppingCart,
  Star, Check, ChevronLeft, ChevronRight as ChRight, Heart,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import ProductImage from "@/components/ui/ProductImage";

// ─── Animation Variants (optimized for performance) ───────────────────────────

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ingredient {
  id: string;
  ingredientName: string;
  quantity: string | null;
  unit: string | null;
  sortOrder: number;
}

interface ProductDescription {
  title: string;
  content: string;
}

interface Specification {
  key: string;
  value: string;
}

interface Product {
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
  productDescriptions: ProductDescription[];
  specifications: Specification[];
  suitableFor: string[];
  howToUse: string[];
  safetyInformation: string[];
  isActive: boolean;
  category?: { id: string; categoryName: string; parentId: string | null };
  ingredients?: Ingredient[];
}

interface Review {
  id: string;
  rating: number;
  reviewText: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
  customer: { id: string; name: string };
}

interface RelatedProduct {
  id: string;
  productName: string;
  productImage: string | null;
  sellingPrice: number;
  originalPrice: number;
  discount: number;
  category?: { categoryName: string };
}

// ─── Star Row ─────────────────────────────────────────────────────────────────

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24"
          fill={s <= Math.round(rating) ? "var(--color-primary)" : "none"}
          stroke="var(--color-primary)" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

// ─── Interactive star picker ──────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <svg width="24" height="24" viewBox="0 0 24 24"
            fill={(hover || value) >= s ? "#D4AF37" : "none"}
            stroke="#D4AF37" strokeWidth="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// ─── Accordion section ────────────────────────────────────────────────────────

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#E8E4DC]">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-4 text-left text-sm font-semibold text-[#1A1A1A] hover:text-[#1A1A1A] transition-colors"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: open ? "2000px" : "0",
          opacity: open ? 1 : 0
        }}
      >
        <div className="pb-4 text-sm text-[#374151] leading-relaxed font-sans">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Related product card ─────────────────────────────────────────────────────

function RelatedCard({ product }: { product: RelatedProduct }) {
  const { addToCart } = useCart();
  const price    = Number(product.sellingPrice);
  const original = Number(product.originalPrice);

  return (
    <Link href={`/pharmacy/${product.id}`}
      className="group flex-shrink-0 w-44 bg-white rounded-lg overflow-hidden border border-[#E8E4DC] shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.12)] hover:border-[#C8B98A] transition-all duration-200">
      <div className="relative aspect-square bg-[#F5F3EF]">
        {product.discount > 0 && (
          <span className="absolute top-1.5 left-1.5 z-10 text-[9px] font-bold bg-[#C0392B] text-white px-1.5 py-0.5 rounded-sm">
            -{product.discount}%
          </span>
        )}
        <ProductImage src={product.productImage} alt={product.productName}
          fill className="object-cover group-hover:scale-105 transition-transform duration-400"
          sizes="176px" />
      </div>
      <div className="p-2.5">
        {product.category && (
          <p className="text-[9px] uppercase tracking-wide text-[#9CA3AF] font-sans mb-0.5">
            {product.category.categoryName}
          </p>
        )}
        <p className="text-xs font-semibold text-[#1A1A1A] line-clamp-2 leading-snug mb-1.5 font-sans">
          {product.productName}
        </p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-[#1A1A1A] font-sans">£{price.toFixed(2)}</span>
          {original > price && (
            <span className="text-[10px] text-[#9CA3AF] line-through font-sans">£{original.toFixed(2)}</span>
          )}
        </div>
        <button
          onClick={e => {
            e.preventDefault();
            addToCart({ id: product.id as unknown as number, name: product.productName, price, image: product.productImage ?? "", category: product.category?.categoryName ?? "" });
          }}
          className="mt-2 w-full py-1.5 rounded-sm text-[11px] font-bold text-white transition-colors duration-200"
          style={{ backgroundColor: "var(--color-text-heading)" }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--color-primary)")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--color-text-heading)")}
        >
          Add to Cart
        </button>
      </div>
    </Link>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { addToCart, items, updateQty } = useCart();

  const [qty,          setQty]          = useState(1);
  const [added,        setAdded]        = useState(false);
  const [reviews,      setReviews]      = useState<Review[]>([]);
  const [reviewStats,  setReviewStats]  = useState({ avg: 0, count: 0 });
  const [related,      setRelated]      = useState<RelatedProduct[]>([]);
  const [relatedIdx,   setRelatedIdx]   = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Wishlist state
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Write review form state
  const [reviewFormOpen,  setReviewFormOpen]  = useState(false);
  const [reviewRating,    setReviewRating]    = useState(5);
  const [reviewText,      setReviewText]      = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Gallery images — primary + additional gallery images
  const allImages = [
    product.productImage,
    ...(product.productImages || []),
  ].filter((img): img is string => !!img);

  const user = session?.user as { id?: string; role?: string } | undefined;
  const isCustomer = !!user?.id && user?.role === "CUSTOMER";

  const cartItem  = items.find(i => i.id === (product.id as unknown as number));
  const price     = Number(product.sellingPrice);
  const original  = Number(product.originalPrice);

  // Check if current user has already reviewed this product
  const hasReviewed = reviews.some(r => r.customer?.id === user?.id);

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

  // Toggle wishlist
  async function toggleWishlist() {
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

  // Fetch reviews — no isApproved filter so customers see their own review immediately
  const loadReviews = () => {
    fetch(`/api/reviews?productId=${product.id}&limit=10`)
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setReviews(json.data ?? []);
          setReviewStats({ avg: json.stats?.averageRating ?? 0, count: json.stats?.totalReviews ?? 0 });
        }
      })
      .catch(() => {});
  };

  // Fetch reviews — no isApproved filter so customers see their own review immediately
  useEffect(() => {
    loadReviews();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) { toast.error("Please sign in to write a review"); return; }
    if (reviewRating < 1) { toast.error("Please select a rating"); return; }
    setReviewSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: user.id,
          productId:  product.id,
          rating:     reviewRating,
          reviewText: reviewText.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || json.message || "Failed to submit review");
      toast.success("Review submitted!");
      setReviewFormOpen(false);
      setReviewText("");
      setReviewRating(5);
      loadReviews();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  }
  // Fetch related products — same category
  useEffect(() => {
    if (!product.categoryId) return;
    fetch(`/api/products?categoryId=${product.categoryId}&isActive=true&limit=10`)
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setRelated((json.data ?? []).filter((p: RelatedProduct) => p.id !== product.id));
        }
      })
      .catch(() => {});
  }, [product.categoryId, product.id]);

  function handleAddToCart() {
    for (let i = 0; i < qty; i++) {
      addToCart({ id: product.id as unknown as number, name: product.productName, price, image: product.productImage ?? "", category: product.category?.categoryName ?? "" });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  function handleBuyNow() {
    handleAddToCart();
    router.push("/pharmacy");
  }

  const VISIBLE = 4;
  const maxIdx  = Math.max(0, related.length - VISIBLE);

  return (
    <div className="pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-6">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-1.5 text-[11px] font-sans text-[#9CA3AF] py-5">
          <Link href="/" className="hover:underline">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/pharmacy" className="hover:underline">Pharmacy</Link>
          {product.category && (
            <>
              <ChevronRight className="w-3 h-3" />
              <Link href={`/pharmacy?categoryId=${product.categoryId}`} className="hover:underline">
                {product.category.categoryName}
              </Link>
            </>
          )}
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#374151] line-clamp-1">{product.productName}</span>
        </nav>

        {/* ── Main product section ── */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-14"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >

          {/* Left — Nike-style image gallery: thumbnails + large viewer */}
          <motion.div className="flex gap-3" variants={fadeIn}>
            {/* Vertical thumbnail strip - always show if images exist */}
            {allImages.length > 0 && (
              <div className="flex flex-col gap-2 w-16 md:w-20">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className="relative aspect-square bg-[#F5F3EF] rounded-md overflow-hidden border-2 transition-all duration-200 cursor-pointer hover:scale-105"
                    style={{
                      borderColor: idx === selectedImageIndex ? "#1A1A1A" : "#E8E4DC",
                    }}
                  >
                    <ProductImage
                      src={img}
                      alt={`${product.productName} view ${idx + 1}`}
                      fill
                      className="object-cover p-1"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Large main image viewer */}
            <div className="flex-1 space-y-3">
              <div className="relative aspect-square bg-[#F5F3EF] rounded-lg overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedImageIndex}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="absolute inset-0"
                  >
                    <ProductImage
                      src={allImages[selectedImageIndex] || product.productImage}
                      alt={product.productName}
                      fill
                      priority
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </motion.div>
                </AnimatePresence>
                {product.discount > 0 && (
                  <span className="absolute top-3 left-3 text-xs font-bold bg-[#C0392B] text-white px-2.5 py-1 rounded-sm z-10">
                    -{product.discount}% OFF
                  </span>
                )}
              </div>

              {/* Image navigation arrows (if multiple images) */}
              {allImages.length > 1 && (
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))}
                    className="w-10 h-10 rounded-full bg-white border border-[#E8E4DC] flex items-center justify-center hover:bg-[#F5F3EF] transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5 text-[#1A1A1A]" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))}
                    className="w-10 h-10 rounded-full bg-white border border-[#E8E4DC] flex items-center justify-center hover:bg-[#F5F3EF] transition-colors"
                    aria-label="Next image"
                  >
                    <ChRight className="w-5 h-5 text-[#1A1A1A]" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right — info */}
          <motion.div className="flex flex-col" variants={slideUp}>
            {/* Category */}
            {product.category && (
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#9CA3AF] font-sans font-semibold mb-2">
                {product.category.categoryName}
              </p>
            )}

            {/* Name */}
            <h1 className="font-heading text-2xl md:text-3xl text-[#1A1A1A] leading-tight mb-3">
              {product.productName}
            </h1>

            {/* Rating — always show */}
            <div className="flex items-center gap-2 mb-4">
              <Stars rating={reviewStats.avg} />
              <span className="text-xs text-[#6B6B6B] font-sans">
                {reviewStats.count > 0
                  ? `${reviewStats.avg.toFixed(1)} (${reviewStats.count} review${reviewStats.count !== 1 ? "s" : ""})`
                  : "No reviews yet"}
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-heading font-bold text-[#1A1A1A]">
                £{price.toFixed(2)}
              </span>
              {original > price && (
                <span className="text-lg text-[#9CA3AF] line-through font-sans">
                  £{original.toFixed(2)}
                </span>
              )}
              {product.discount > 0 && (
                <span className="text-sm font-semibold text-green-600 font-sans">
                  Save {product.discount}%
                </span>
              )}
            </div>

            {/* First description — paragraph (How to Use) */}
            {product.productDescriptions?.length > 0 && (
              <p className="text-sm text-[#374151] font-sans leading-relaxed mb-3">
                {product.productDescriptions[0].content}
              </p>
            )}

            {/* Remaining descriptions (Side Effects, Storage etc.) — bullet points */}
            {product.productDescriptions?.length > 1 && (
              <ul className="mb-5 space-y-1.5">
                {product.productDescriptions.slice(1).map((desc, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm font-sans text-[#374151]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF] flex-shrink-0 mt-1.5" />
                    <span>
                      <strong className="font-semibold text-[#1A1A1A]">{desc.title}:</strong>{" "}
                      {desc.content}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {/* Divider */}
            <div className="border-t border-[#E8E4DC] mb-4" />

            {/* Suitable for */}
            {product.suitableFor?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5">
                {product.suitableFor.map(tag => (
                  <span key={tag}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full border font-sans capitalize"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)", backgroundColor: "var(--color-bg-card)" }}>
                    {tag.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            )}

            {/* Qty + Add/Buy + Wishlist */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center border border-[#D1D5DB] rounded-md overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-9 h-10 flex items-center justify-center text-[#374151] hover:bg-[#F5F3EF] transition-colors text-lg font-bold">
                  −
                </button>
                <span className="w-10 text-center text-sm font-semibold text-[#1A1A1A] font-sans">{qty}</span>
                <button onClick={() => setQty(q => q + 1)}
                  className="w-9 h-10 flex items-center justify-center text-[#374151] hover:bg-[#F5F3EF] transition-colors text-lg font-bold">
                  +
                </button>
              </div>

              <button onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-bold border transition-all duration-200 font-sans hover:scale-[1.02] active:scale-[0.98]"
                style={added
                  ? { background: "#f0fdf4", borderColor: "#86efac", color: "#16a34a" }
                  : { background: "#ffffff", borderColor: "#D1D5DB", color: "#1A1A1A" }}
                onMouseEnter={e => {
                  if (!added) {
                    e.currentTarget.style.background = "#D4AF37";
                    e.currentTarget.style.color = "#ffffff";
                    e.currentTarget.style.borderColor = "#D4AF37";
                  }
                }}
                onMouseLeave={e => {
                  if (!added) {
                    e.currentTarget.style.background = "#ffffff";
                    e.currentTarget.style.color = "#1A1A1A";
                    e.currentTarget.style.borderColor = "#D1D5DB";
                  }
                }}>
                {added ? <><Check className="w-4 h-4" /> Added!</> : <><ShoppingCart className="w-4 h-4" /> Add to Cart</>}
              </button>

              <button
                onClick={toggleWishlist}
                disabled={wishlistLoading}
                className="p-2.5 rounded-md border border-[#D1D5DB] hover:border-red-400 hover:bg-red-50 transition-all duration-200 disabled:opacity-50 group"
                title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart
                  className={`w-5 h-5 transition-all ${
                    isInWishlist 
                      ? "fill-red-500 text-red-500" 
                      : "text-[#374151] group-hover:text-red-500 group-hover:fill-red-100"
                  }`}
                />
              </button>
            </div>

            {/* Cart qty controls */}
            {cartItem && (
              <div className="flex items-center gap-2 mb-3 text-xs font-sans text-[#6B6B6B]">
                <span>{cartItem.quantity} in cart</span>
                <button onClick={() => updateQty(cartItem.id, cartItem.quantity - 1)}
                  className="w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all text-xs">−</button>
                <button onClick={() => updateQty(cartItem.id, cartItem.quantity + 1)}
                  className="w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all text-xs">+</button>
              </div>
            )}

            <button onClick={handleBuyNow}
              className="w-full py-3 rounded-md text-sm font-bold text-white transition-all duration-200 font-sans hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
              style={{ 
                background: "#1A1A1A"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "#D4AF37";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "#1A1A1A";
              }}>
              Buy Now
            </button>
          </motion.div>
        </motion.div>

        {/* ── Detail sections (2-col) ── */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-14"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >

          {/* Left col — accordions */}
          <div className="md:col-span-2 space-y-0 border-t border-[#E8E4DC]">
            {/* Ingredients */}
            {product.ingredients && product.ingredients.length > 0 && (
              <Accordion title="Ingredients" defaultOpen={true}>
                <ul className="space-y-1.5">
                  {product.ingredients
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map(ing => (
                      <li key={ing.id} className="flex items-start gap-2 text-sm font-sans">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF] flex-shrink-0 mt-1.5" />
                        <span>
                          {ing.ingredientName}
                          {ing.quantity ? ` — ${ing.quantity}${ing.unit ?? ""}` : ""}
                        </span>
                      </li>
                    ))}
                </ul>
              </Accordion>
            )}

            {/* Dynamic description sections — only index 0 shown as paragraph above, rest shown as bullets in right panel */}

            {/* How to Use accordion */}
            {product.howToUse?.length > 0 && (
              <Accordion title="How to Use">
                <ul className="space-y-1.5">
                  {product.howToUse.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm font-sans">
                      <span className="font-semibold text-[#9CA3AF] flex-shrink-0">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </Accordion>
            )}

            {/* Safety Information accordion */}
            {product.safetyInformation?.length > 0 && (
              <Accordion title="Safety Information">
                <ul className="space-y-1.5">
                  {product.safetyInformation.map((info, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm font-sans">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF] flex-shrink-0 mt-1.5" />
                      <span>{info}</span>
                    </li>
                  ))}
                </ul>
              </Accordion>
            )}
          </div>

          {/* Right col — specifications (always shown, merges product fields + custom specs) */}
          <div className="bg-[#F5F3EF] rounded-lg p-5 border border-[#E8E4DC] h-fit">
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-4 font-heading">Specifications</h3>
            <dl className="space-y-0">
              {[
                // Auto-generated from product fields
                { key: "Category", value: product.category?.categoryName ?? null },
                { key: "Form",     value: product.dosageForm              ?? null },
                { key: "Strength", value: product.strength                ?? null },
                { key: "Pack",     value: `${product.packSize} ${product.unitType}`.trim() || null },
                // Custom specs from DB
                ...(product.specifications ?? []),
              ]
                .filter(s => s.value)
                .map((spec, i) => (
                  <div key={i} className="flex justify-between gap-4 text-xs font-sans border-b border-[#E8E4DC] py-2.5 last:border-0">
                    <dt className="text-[#9CA3AF] font-medium flex-shrink-0">{spec.key}</dt>
                    <dd className="text-[#1A1A1A] font-semibold text-right">{spec.value}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </motion.div>

        {/* ── Reviews ── */}
        <motion.div 
          className="mb-16 border-t border-[#E8E4DC] pt-10"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <h2 className="font-heading text-xl text-[#1A1A1A] text-center mb-8">Customer Reviews</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

            {/* Left — aggregate */}
            <div className="flex flex-col items-center justify-center text-center p-6 bg-[#F5F3EF] rounded-lg border border-[#E8E4DC]">
              <span className="text-6xl font-heading font-bold text-[#1A1A1A] leading-none mb-2">
                {reviewStats.avg > 0 ? reviewStats.avg.toFixed(1) : "—"}
              </span>
              <div className="mb-1.5"><Stars rating={reviewStats.avg} size={18} /></div>
              <p className="text-xs text-[#9CA3AF] font-sans mb-4">
                Based on {reviewStats.count} review{reviewStats.count !== 1 ? "s" : ""}
              </p>
              <button
                onClick={() => {
                  if (!isCustomer) {
                    toast.error("Please sign in as a customer to write a review");
                    return;
                  }
                  if (hasReviewed) {
                    toast.info("You've already reviewed this product");
                    return;
                  }
                  setReviewFormOpen(true);
                }}
                className="w-full px-4 py-2 text-xs font-bold border rounded-sm font-sans transition-colors"
                style={{ borderColor: "var(--color-text-heading)", color: "var(--color-text-heading)" }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.backgroundColor = "var(--color-text-heading)"; el.style.color = "#fff"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.backgroundColor = ""; el.style.color = "var(--color-text-heading)"; }}>
                Write a Review
              </button>
            </div>

            {/* Right — review cards */}
            <div className="md:col-span-3 space-y-5">
              {reviews.length === 0 ? (
                <div className="flex items-center justify-center h-full py-10">
                  <p className="text-sm text-[#9CA3AF] font-sans">No reviews yet. Be the first to review this product.</p>
                </div>
              ) : (
                reviews.map(r => (
                  <div key={r.id} className="bg-white border border-[#E8E4DC] rounded-lg p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-3">
                        {/* Avatar circle */}
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-text)" }}>
                          {(r.customer?.name ?? "A").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-[#1A1A1A] font-sans">
                              {r.customer?.name ?? "Anonymous"}
                            </span>
                            {r.isVerifiedPurchase && (
                              <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                                Verified Purchase
                              </span>
                            )}
                          </div>
                          <Stars rating={r.rating} size={11} />
                        </div>
                      </div>
                      <time className="text-[10px] text-[#9CA3AF] font-sans flex-shrink-0">
                        {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </time>
                    </div>
                    {r.reviewText && (
                      <p className="text-sm text-[#374151] font-sans leading-relaxed mt-3">
                        {r.reviewText}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Related products ── */}
        {related.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-xl text-[#1A1A1A]">You May Also Like</h2>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setRelatedIdx(i => Math.max(0, i - 1))}
                  disabled={relatedIdx === 0}
                  className="w-7 h-7 flex items-center justify-center border border-[#D1D5DB] rounded-sm text-[#374151] hover:border-[#D4AF37] disabled:opacity-30 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRelatedIdx(i => Math.min(maxIdx, i + 1))}
                  disabled={relatedIdx >= maxIdx}
                  className="w-7 h-7 flex items-center justify-center border border-[#D1D5DB] rounded-sm text-[#374151] hover:border-[#D4AF37] disabled:opacity-30 transition-colors">
                  <ChRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-4 overflow-hidden">
              {related.slice(relatedIdx, relatedIdx + VISIBLE).map(p => (
                <RelatedCard key={p.id} product={p} />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Review Form Modal ── */}
      <AnimatePresence>
        {reviewFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setReviewFormOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6"
            >
              <h3 className="text-xl font-heading text-[#1A1A1A] mb-4">Write a Review</h3>
              <form onSubmit={submitReview} className="space-y-4">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A1A] mb-2 font-sans">
                    Rating <span className="text-red-500">*</span>
                  </label>
                  <StarPicker value={reviewRating} onChange={setReviewRating} />
                </div>

                {/* Review Text */}
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A1A] mb-2 font-sans">
                    Your Review (optional)
                  </label>
                  <textarea
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    placeholder="Share your experience with this product..."
                    rows={4}
                    className="w-full border border-[#E5E5E5] rounded-sm px-3 py-2 text-sm font-sans focus:outline-none focus:border-[#D4AF37] resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewFormOpen(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium border border-[#E5E5E5] rounded-sm text-[#1A1A1A] hover:bg-[#F9F9F9] transition-colors font-sans"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="flex-1 px-4 py-2 text-sm font-bold rounded-sm text-white transition-colors font-sans disabled:opacity-50"
                    style={{ backgroundColor: "var(--color-text-heading)" }}
                  >
                    {reviewSubmitting ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
