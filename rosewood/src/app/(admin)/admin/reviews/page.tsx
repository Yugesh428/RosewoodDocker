"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Star, Trash2, Search, RefreshCw, ShieldCheck, X, ChevronLeft, ChevronRight } from "lucide-react";

type Review = {
  id: string;
  rating: number;
  reviewText: string | null;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  createdAt: string;
  customer?: { id: string; name: string; email: string };
  product?:  { id: string; productName: string };
};

type Pagination = {
  total: number; page: number; limit: number;
  pages: number; hasNext: boolean; hasPrev: boolean;
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} width="12" height="12" viewBox="0 0 24 24"
          fill={s <= rating ? "#D4AF37" : "none"}
          stroke="#D4AF37" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews,    setReviews]    = useState<Review[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page,       setPage]       = useState(1);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page",  String(page));
      params.set("limit", "20");
      if (search) params.set("search", search);

      const res  = await fetch(`/api/reviews/admin?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to load reviews");
      setReviews(json.data || []);
      setPagination(json.pagination ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleDelete = async (id: string, productName: string) => {
    if (!confirm(`Delete this review for "${productName}"? This cannot be undone.`)) return;
    try {
      const res  = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Delete failed");
      toast.success("Review deleted");
      fetchReviews();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="p-6 bg-[#F9F9F9] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
            <Star className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-2xl font-heading text-[#1A1A1A]">Reviews</h1>
            <p className="text-xs text-[#6B6B6B]">
              {pagination ? `${pagination.total} total review${pagination.total !== 1 ? "s" : ""}` : "Loading..."}
            </p>
          </div>
        </div>
        <button
          onClick={fetchReviews}
          className="flex items-center gap-2 px-3 py-2 text-sm text-[#6B6B6B] border border-[#E5E5E5] rounded-md hover:bg-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search by customer name, email or product..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-[#E5E5E5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white"
          />
        </div>
        {searchInput && (
          <button
            onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
            className="flex items-center gap-1 px-3 py-2 text-sm text-[#6B6B6B] hover:text-[#1A1A1A] border border-[#E5E5E5] rounded-md"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-[#E5E5E5] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#F9F9F9] border-b border-[#E5E5E5]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-[#1A1A1A]">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] hidden md:table-cell">Product</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1A1A1A]">Rating</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] hidden lg:table-cell">Review</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3 text-center font-medium text-[#1A1A1A]">Action</th>
                </tr>
              </thead>
              <tbody>
                {reviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-[#6B6B6B]">
                      No reviews found.
                    </td>
                  </tr>
                ) : (
                  reviews.map(r => (
                    <tr key={r.id} className="border-b border-[#E5E5E5] hover:bg-[#F9F9F9]/60 transition-colors">
                      {/* Customer */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#1A1A1A]">{r.customer?.name ?? "—"}</p>
                        <p className="text-xs text-[#6B6B6B]">{r.customer?.email ?? "—"}</p>
                        {r.isVerifiedPurchase && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-green-700 font-semibold mt-0.5">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </td>
                      {/* Product */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-[#374151]">{r.product?.productName ?? "—"}</span>
                      </td>
                      {/* Rating */}
                      <td className="px-4 py-3">
                        <Stars rating={r.rating} />
                        <span className="text-xs text-[#6B6B6B] block mt-0.5">{r.rating}/5</span>
                      </td>
                      {/* Review text */}
                      <td className="px-4 py-3 hidden lg:table-cell max-w-xs">
                        {r.reviewText
                          ? <p className="text-sm text-[#374151] line-clamp-2">{r.reviewText}</p>
                          : <span className="text-xs text-[#9CA3AF] italic">No text</span>
                        }
                      </td>
                      {/* Date */}
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-[#6B6B6B] whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                      {/* Delete */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDelete(r.id, r.product?.productName ?? "product")}
                          title="Delete review"
                          className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-[#6B6B6B]">
              <span>
                {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-[#E5E5E5] disabled:opacity-40 hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="px-3 py-1.5 bg-white border border-[#D4AF37] rounded-md font-medium text-[#1A1A1A]">
                  {pagination.page} / {pagination.pages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={!pagination.hasNext}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-[#E5E5E5] disabled:opacity-40 hover:bg-white transition-colors"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
