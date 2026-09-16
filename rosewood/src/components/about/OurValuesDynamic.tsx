"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type OurValue = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: "easeOut" },
  }),
};

export default function OurValuesDynamic() {
  const [values, setValues] = useState<OurValue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ui/values")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setValues(json.data);
        }
      })
      .catch((err) => console.error("Failed to load values:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 flex justify-center">
          <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  if (values.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          className="text-center mb-14"
        >
          <p className="text-xs tracking-[0.35em] uppercase text-[#D4AF37] font-sans mb-3">
            What Drives Us
          </p>
          <h2 className="font-heading text-3xl text-[#1A1A1A]">Our Values</h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {values.map((v, i) => (
            <motion.div
              key={v.id}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i * 0.1}
              className="bg-[#F9F9F9] border border-[#E5E5E5] rounded-sm p-7 flex flex-col gap-4 hover:border-[#D4AF37]/50 hover:shadow-sm transition-all duration-300 group"
            >
              {/* Icon/Image */}
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center group-hover:bg-[#D4AF37]/20 transition-colors duration-300 overflow-hidden">
                {v.imageUrl ? (
                  <Image
                    src={v.imageUrl}
                    alt={v.title}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                    unoptimized={v.imageUrl.startsWith('/uploads/')}
                  />
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                )}
              </div>
              <h3 className="font-heading text-lg text-[#1A1A1A]">{v.title}</h3>
              <p className="text-xs text-[#6B6B6B] font-sans leading-relaxed">
                {v.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
