"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Heart, ShoppingCart, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import ProductImage from "@/components/ui/ProductImage";

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

interface CustomerWishlistClientProps {
  customerId: string;
  customerName: string;
}

export default function CustomerWishlistClient({ customerId, customerName }: CustomerWishlistClientProps) {
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wishlist?customerId=${customerId}`);
      const json = await res.json();

      console.log("Wishlist API Response:", json); // DEBUG

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to load wishlist");
      }

      console.log("Wishlist data:", json.data); // DEBUG
      setWishlist(json.data || []);
    } catch (err) {
      console.error("Wishlist fetch error:", err); // DEBUG
      toast.error(err instanceof Error ? err.message : "Failed to load wishlist");
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = async (id: string, productName: string) => {
    if (!confirm(`Remove "${productName}" from your wishlist?`)) return;

    try {
      const res = await fetch(`/api/wishlist/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to remove item");
      }

      toast.success(`Removed "${productName}" from wishlist`);
      setWishlist((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.productName,
      price: product.sellingPrice,
      image: product.productImage || "",
      category: product.category?.categoryName || "",
    });
    toast.success(`Added "${product.productName}" to cart!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <header className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/" className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] mb-2 inline-block">
            ← Back to Home
          </Link>
          <h1 className="font-heading text-2xl text-[#1A1A1A]">{customerName} Wishlist</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">
            {wishlist.length} item{wishlist.length !== 1 ? "s" : ""} saved
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {wishlist.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#E5E5E5] p-12 text-center">
            <Heart className="w-16 h-16 text-[#E5E5E5] mx-auto mb-4" strokeWidth={1.5} />
            <h2 className="text-xl font-heading text-[#1A1A1A] mb-2">Your wishlist is empty</h2>
            <p className="text-sm text-[#6B6B6B] mb-6">
              Start saving your favorite products by clicking the heart icon on any product.
            </p>
            <Link
              href="/pharmacy"
              className="inline-block px-6 py-2.5 bg-[#D4AF37] text-white font-semibold rounded-md hover:bg-[#b8952e] transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((item) => {
              const product = item.product;
              if (!product) return null;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm border border-[#E5E5E5] overflow-hidden hover:shadow-md transition-shadow"
                >
                  <Link href={`/pharmacy/${product.id}`} className="block relative">
                    <div className="relative h-56 w-full bg-[#F9F9F9]">
                      <ProductImage
                        src={product.productImage || ""}
                        alt={product.productName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      {product.discount && product.discount > 0 && (
                        <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                          {product.discount}% OFF
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="p-4">
                    {product.category && (
                      <span className="text-xs text-[#6B6B6B] uppercase tracking-wider">
                        {product.category.categoryName}
                      </span>
                    )}

                    <Link href={`/pharmacy/${product.id}`} className="block mt-1">
                      <h3 className="font-medium text-[#1A1A1A] hover:text-[#D4AF37] transition-colors line-clamp-2">
                        {product.productName}
                      </h3>
                    </Link>

                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-lg font-bold text-[#1A1A1A]">
                        £{Number(product.sellingPrice).toFixed(2)}
                      </span>
                      {product.originalPrice && Number(product.originalPrice) > Number(product.sellingPrice) && (
                        <span className="text-sm text-[#6B6B6B] line-through">
                          £{Number(product.originalPrice).toFixed(2)}
                        </span>
                      )}
                    </div>

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
                        className="p-2 border border-[#E5E5E5] rounded-md hover:bg-red-50 hover:border-red-200 transition-colors group"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4 text-[#6B6B6B] group-hover:text-red-500 transition-colors" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
