"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

type CollectionCategory = {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  isActive: boolean;
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
  photo2Url: string | null;
  isActive: boolean;
};

// ─── Helper: extract YouTube embed URL ───────────────────────────────────────
function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let videoId: string | null = null;
    if (u.hostname.includes("youtube.com")) {
      videoId = u.searchParams.get("v");
    } else if (u.hostname.includes("youtu.be")) {
      videoId = u.pathname.slice(1);
    }
    if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0`;
  } catch {}
  return null;
}

// ─── Helper: extract Instagram embed URL ──────────────────────────────────────
function getInstagramEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("instagram.com")) {
      // Strip trailing slash and append /embed
      const path = u.pathname.replace(/\/$/, "");
      return `https://www.instagram.com${path}/embed`;
    }
  } catch {}
  return null;
}

// ─── Video renderer — handles YouTube, Instagram, or direct file ──────────────
function VideoMedia({ videoUrl, videoFile, title }: { videoUrl: string | null; videoFile: string | null; title: string }) {
  // Prefer local video file if available
  if (videoFile) {
    return (
      <video
        src={videoFile}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
      />
    );
  }

  if (videoUrl) {
    const ytEmbed = getYouTubeEmbedUrl(videoUrl);
    if (ytEmbed) {
      return (
        <iframe
          src={ytEmbed}
          title={title}
          allow="autoplay; encrypted-media"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
          style={{ border: "none", pointerEvents: "none" }}
        />
      );
    }

    const igEmbed = getInstagramEmbedUrl(videoUrl);
    if (igEmbed) {
      return (
        <iframe
          src={igEmbed}
          title={title}
          allowFullScreen
          className="absolute inset-0 w-full h-full"
          style={{ border: "none", pointerEvents: "none" }}
          scrolling="no"
        />
      );
    }

    // Generic video URL (mp4, etc.)
    return (
      <video
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
      />
    );
  }

  return null;
}

export default function ProductCollectionDynamic() {
  const [categories, setCategories] = useState<CollectionCategory[]>([]);
  const [products, setProducts] = useState<CollectionProduct[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch categories and products in parallel
    Promise.all([
      fetch("/api/ui/collection/categories").then((r) => r.json()),
      fetch("/api/ui/collection/products").then((r) => r.json()),
    ])
      .then(([catJson, prodJson]) => {
        if (catJson.success && catJson.data) {
          setCategories(catJson.data);
          if (catJson.data.length > 0) setActiveTab(catJson.data[0].id);
        }
        if (prodJson.success && prodJson.data) {
          setProducts(prodJson.data);
        }
      })
      .catch((err) => console.error("Failed to load collection data:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts =
    activeTab === ""
      ? products
      : products.filter((p) => p.categoryId === activeTab);

  const displayProducts = filteredProducts.slice(0, 3); // Show max 3 cards

  if (loading) {
    return (
      <section className="py-10 flex justify-center">
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
      </section>
    );
  }

  return (
    <section className="pt-4 pb-4">
      <div className="w-full px-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-left mb-8"
        >
          <h2 className="font-heading text-3xl text-[#1A1A1A]">
            Our Product Collection
          </h2>
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-8 mb-10 flex-wrap">
          {categories.map(c => ({ id: c.id, name: c.name })).map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="relative text-xs font-sans tracking-[0.18em] uppercase pb-2 transition-colors duration-200 border-none bg-transparent"
                style={{ color: active ? "#1A1A1A" : "#6B6B6B" }}>
                {tab.name}
                <span
                  className="absolute left-0 bottom-0 h-[2px] rounded-full"
                  style={{
                    backgroundColor: "#2d6a4f",
                    width: active ? "100%" : "0%",
                    transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)",
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Mosaic grid */}
        {displayProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Large card - First product (video or background image) */}
            {displayProducts[0] && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="md:col-span-2 relative group overflow-hidden rounded-sm h-80 md:h-96 cursor-pointer"
              >
                {/* Video support: handles YouTube, Instagram, or uploaded file */}
                {(displayProducts[0].videoFile || displayProducts[0].videoUrl) ? (
                  <VideoMedia
                    videoUrl={displayProducts[0].videoUrl}
                    videoFile={displayProducts[0].videoFile}
                    title={displayProducts[0].title}
                  />
                ) : displayProducts[0].backgroundImage ? (
                  <Image
                    src={displayProducts[0].backgroundImage}
                    alt={displayProducts[0].title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    unoptimized={displayProducts[0].backgroundImage.startsWith('/uploads/')}
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  {displayProducts[0].subtitle && (
                    <p className="text-[10px] tracking-[0.25em] uppercase font-sans mb-1 text-white/80">
                      {displayProducts[0].subtitle}
                    </p>
                  )}
                  <h3 className="font-heading text-xl text-white mb-3">
                    {displayProducts[0].title}
                  </h3>
                  <Link
                    href="/pharmacy"
                    className="inline-flex items-center gap-1.5 text-xs font-sans text-white border border-white/50 px-4 py-2 hover:bg-white hover:text-black transition-all duration-200"
                  >
                    Shop Category
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Small cards - Photo 1 and Photo 2 from the FIRST product */}
            <div className="flex flex-col gap-4">
              {/* Photo 1 */}
              {displayProducts[0]?.photo1Url && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0, duration: 0.5 }}
                  className="relative group overflow-hidden rounded-sm flex-1 min-h-44 cursor-pointer"
                >
                  <Image
                    src={displayProducts[0].photo1Url}
                    alt={displayProducts[0].photo1Title || displayProducts[0].title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    unoptimized={displayProducts[0].photo1Url.startsWith('/uploads/')}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-4">
                    {displayProducts[0].photo1Subtitle && (
                      <p className="text-[10px] tracking-[0.2em] uppercase font-sans mb-0.5 text-white/80">
                        {displayProducts[0].photo1Subtitle}
                      </p>
                    )}
                    <h3 className="font-heading text-sm text-white">
                      {displayProducts[0].photo1Title || displayProducts[0].title}
                    </h3>
                  </div>
                </motion.div>
              )}

              {/* Photo 2 */}
              {displayProducts[0]?.photo2Url && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="relative group overflow-hidden rounded-sm flex-1 min-h-44 cursor-pointer"
                >
                  <Image
                    src={displayProducts[0].photo2Url}
                    alt={displayProducts[0].photo2Title || displayProducts[0].title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    unoptimized={displayProducts[0].photo2Url.startsWith('/uploads/')}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-4">
                    {displayProducts[0].photo2Subtitle && (
                      <p className="text-[10px] tracking-[0.2em] uppercase font-sans mb-0.5 text-white/80">
                        {displayProducts[0].photo2Subtitle}
                      </p>
                    )}
                    <h3 className="font-heading text-sm text-white">
                      {displayProducts[0].photo2Title || displayProducts[0].title}
                    </h3>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-[#6B6B6B] text-sm">
            No products available in this category.
          </div>
        )}

        {/* View all */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link href="/pharmacy"
            className="collection-view-all inline-flex items-center gap-2 text-xs font-sans tracking-widest uppercase px-10 py-3 transition-all duration-300"
            style={{ color: "#ffffff", backgroundColor: "#1A1A1A", border: "none", borderRadius: "9999px" }}>
            View All Products
          </Link>
          <style>{`
            .collection-view-all:hover {
              background-color: #D4AF37 !important;
              color: #ffffff !important;
            }
          `}</style>
        </motion.div>
      </div>
    </section>
  );
}
