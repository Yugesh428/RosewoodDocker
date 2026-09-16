"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

type HeroSlide = {
  id: string;
  imageUrl: string;
  title: string | null;
  subtitle: string | null;
  order: number;
  isActive: boolean;
};

export default function HeroSectionDynamic() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch active hero slides
    fetch("/api/ui/hero")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setSlides(json.data);
        }
      })
      .catch((err) => console.error("Failed to load hero slides:", err))
      .finally(() => setLoading(false));
  }, []);

  // Auto-rotate slides every 5 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (loading) {
    return (
      <section className="relative w-full h-[90vh] min-h-[580px] pt-20 flex items-center justify-center"
        style={{ backgroundColor: "transparent" }}>
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
      </section>
    );
  }

  if (slides.length === 0) {
    // Fallback to static content if no slides
    return (
      <section className="relative w-full h-[90vh] min-h-[580px] overflow-hidden pt-20">
        <Image
          src="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=1600&q=80"
          alt="Luxury apothecary products"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        <div className="relative z-10 h-full flex items-center">
          <div className="w-full px-12">
            <div className="max-w-lg">
              <p className="text-xs tracking-[0.3em] uppercase text-[#1A1A1A] font-sans mb-4">
                Your Personal Pharmacy
              </p>
              <h1 className="font-heading text-4xl md:text-5xl text-[#1A1A1A] leading-tight mb-5">
                Quality Healthcare,<br />Right at Your Door
              </h1>
              <Link href="/pharmacy"
                className="inline-flex items-center gap-2 text-xs font-sans tracking-widest uppercase px-7 py-3 transition-all duration-300"
                style={{ backgroundColor: "#D4AF37", color: "#1A1A1A", borderRadius: "9999px" }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = "#b8952e"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = "#D4AF37"; }}>
                Explore Pharmacy
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-primary) 40%, transparent), transparent)` }} />
      </section>
    );
  }

  const currentSlide = slides[currentIndex];

  return (
    <section className="relative w-full h-[90vh] min-h-[580px] overflow-hidden pt-20">
      {/* Background image with transition */}
      <motion.div
        key={currentSlide.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0"
      >
        <Image
          src={currentSlide.imageUrl}
          alt={currentSlide.title || "Hero slide"}
          fill
          className="object-cover object-center"
          priority={currentIndex === 0}
        />
      </motion.div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="w-full px-12">
          <div className="max-w-lg">
            {currentSlide.title && (
              <motion.h1
                key={`title-${currentSlide.id}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="hero-heading font-heading text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-4 cursor-default"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  transition: "color 0.3s ease",
                }}
                dangerouslySetInnerHTML={{ __html: currentSlide.title.replace(/\n/g, "<br />") }}
              />
            )}

            {currentSlide.subtitle && (
              <motion.p
                key={`subtitle-${currentSlide.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-sm font-sans mb-8 leading-relaxed"
                style={{
                  color: "rgba(255,255,255,0.80)",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {currentSlide.subtitle}
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Link href="/pharmacy"
                className="inline-flex items-center gap-2 text-xs font-sans tracking-widest uppercase px-7 py-3 transition-all duration-300"
                style={{ backgroundColor: "#D4AF37", color: "#1A1A1A", borderRadius: "9999px" }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = "#b8952e"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = "#D4AF37"; }}>
                Explore Pharmacy
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? "w-8"
                  : "bg-white/50 hover:bg-white/80"
              }`}
              style={idx === currentIndex ? { backgroundColor: "var(--color-primary)" } : undefined}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-primary) 40%, transparent), transparent)` }} />

      <style>{`
        .hero-heading:hover { color: #D4AF37 !important; }
      `}</style>
    </section>
  );
}
