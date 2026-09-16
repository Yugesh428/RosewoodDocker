"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type Mission = {
  id: string;
  subtitle: string;
  description: string;
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: "easeOut" },
  }),
};

export default function OurMissionDynamic() {
  const [data, setData] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ui/mission")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setData(json.data);
        }
      })
      .catch((err) => console.error("Failed to load mission:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-[#F9F9F9]">
        <div className="max-w-3xl mx-auto px-6 text-center flex justify-center">
          <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className="py-20 bg-[#F9F9F9]">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          className="text-xs tracking-[0.35em] uppercase text-[#D4AF37] font-sans mb-4"
        >
          Our Mission
        </motion.p>
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0.1}
          className="font-heading text-3xl text-[#1A1A1A] mb-8"
        >
          {data.subtitle}
        </motion.h2>
        <motion.blockquote
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0.2}
          className="relative"
        >
          {/* Large quote mark */}
          <span className="absolute -top-4 -left-2 font-heading text-7xl text-[#D4AF37]/20 leading-none select-none">
            &ldquo;
          </span>
          <p className="font-heading text-xl md:text-2xl text-[#1A1A1A] leading-relaxed italic px-6">
            {data.description}
          </p>
          <span className="absolute -bottom-6 -right-2 font-heading text-7xl text-[#D4AF37]/20 leading-none select-none">
            &rdquo;
          </span>
        </motion.blockquote>
      </div>
    </section>
  );
}
