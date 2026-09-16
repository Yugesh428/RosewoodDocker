"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type OurStory = {
  id: string;
  imageUrl: string | null;
  title: string;
  paragraph1: string;
  paragraph2: string | null;
  paragraph3: string | null;
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: "easeOut" },
  }),
};

export default function OurStoryDynamic() {
  const [data, setData] = useState<OurStory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ui/our-story")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setData(json.data);
        }
      })
      .catch((err) => console.error("Failed to load our story:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6 flex justify-center">
          <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
          {/* Image */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="relative h-[420px] overflow-hidden rounded-sm bg-gray-100"
          >
            <Image
              src={data.imageUrl || "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=80"}
              alt="Our story"
              fill
              className="object-cover object-center"
              unoptimized={data.imageUrl ? data.imageUrl.startsWith('/uploads/') : false}
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                const target = e.target as HTMLImageElement;
                target.src = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=80";
              }}
            />
            {/* Gold corner accent */}
            <div className="absolute top-4 left-4 w-10 h-10 border-t border-l border-[#D4AF37]/60" />
            <div className="absolute bottom-4 right-4 w-10 h-10 border-b border-r border-[#D4AF37]/60" />
          </motion.div>

          {/* Text */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.15}
            className="flex flex-col gap-5"
          >
            <p className="text-xs tracking-[0.3em] uppercase text-[#D4AF37] font-sans">
              Our Story
            </p>
            <h2 className="font-heading text-3xl text-[#1A1A1A] leading-snug">
              {data.title}
            </h2>
            <div className="w-8 h-[1px] bg-[#D4AF37]" />
            <p className="text-sm text-[#6B6B6B] font-sans leading-relaxed">
              {data.paragraph1}
            </p>
            {data.paragraph2 && (
              <p className="text-sm text-[#6B6B6B] font-sans leading-relaxed">
                {data.paragraph2}
              </p>
            )}
            {data.paragraph3 && (
              <p className="text-sm text-[#6B6B6B] font-sans leading-relaxed">
                {data.paragraph3}
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
