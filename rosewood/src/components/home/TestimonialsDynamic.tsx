"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

type Testimonial = {
  id: string;
  photo: string;
  rating: number;
  quote: string;
  authorName: string;
  authorTitle: string | null;
  displayOrder: number;
  isActive: boolean;
};

function StarIcon() {
  return (
      <svg width="13" height="13" viewBox="0 0 24 24"
        fill="var(--color-primary)" stroke="var(--color-primary)" strokeWidth="1">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
  );
}

export default function TestimonialsDynamic() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const { homeBg } = useTheme();
  const bg =
    homeBg === "white" ? "#ffffff" :
    homeBg === "soft-blue" ? "#f0f8ff" :
    homeBg === "near-blue" ? "#cce8f7" :
    homeBg === "creamy-blue" ? "#e8f4f8" :
    "#dff0fb";

  useEffect(() => {
    fetch("/api/ui/testimonials")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          // Show max 3 testimonials
          setTestimonials(json.data.slice(0, 3));
        }
      })
      .catch((err) => console.error("Failed to load testimonials:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="pt-10 pb-20 flex justify-center" style={{ backgroundColor: bg }}>
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
      </section>
    );
  }

  if (testimonials.length === 0) {
    return null; // Don't show section if no testimonials
  }

  return (
    <section className="pt-6 pb-20" style={{ backgroundColor: bg }}>
      <div className="w-full px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <p className="text-xs tracking-[0.3em] uppercase text-[#1A1A1A] font-sans mb-3">
            What Our Clients Say
          </p>
          <h2 className="font-heading text-3xl text-[#1A1A1A]">
            Trusted by Our Community
          </h2>
          <p className="text-sm text-[#6B6B6B] font-sans mt-2 max-w-md mx-auto">
            Experience the difference of a pharmacy that prioritises your care,
            privacy, and well‑being.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="border rounded-sm p-7 flex flex-col gap-4 transition-all duration-300"
              style={{ backgroundColor: "transparent", borderColor: "var(--color-primary)" }}
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, s) => (
                  <StarIcon key={s} />
                ))}
              </div>

              {/* Quote */}
              <p className="text-[#1A1A1A] text-sm font-sans leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t border-[#E5E5E5]">
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border"
                  style={{ background: `color-mix(in srgb, var(--color-primary) 15%, transparent)`, borderColor: `color-mix(in srgb, var(--color-primary) 40%, transparent)` }}>
                  {t.photo ? (
                    <Image
                      src={t.photo}
                      alt={t.authorName}
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-[10px] font-semibold text-[#1A1A1A] font-sans">
                        {t.authorName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[#1A1A1A] text-xs font-semibold font-sans">
                    {t.authorName}
                  </p>
                  {t.authorTitle && (
                    <p className="text-[#6B6B6B] text-[10px] font-sans">
                      {t.authorTitle}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
