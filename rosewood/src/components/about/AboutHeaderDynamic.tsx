"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type AboutTitle = {
  id: string;
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

export default function AboutHeaderDynamic() {
  const [data, setData] = useState<AboutTitle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ui/about")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setData(json.data);
        }
      })
      .catch((err) => console.error("Failed to load about description:", err))
      .finally(() => setLoading(false));
  }, []);

  const defaultDescription = "Elevating the pharmacy experience through meticulous curation, expert care, and an unwavering commitment to your holistic well-being.";

  return (
    <section className="py-20 text-center relative overflow-hidden bg-gradient-to-r from-[#2d6a4f] to-[#52b788]">
      {/* Background pattern overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)'
        }}></div>
      </div>

      {/* Static subtitle */}
      <motion.p
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0.1}
        className="text-xs tracking-[0.35em] uppercase text-[#D4AF37] font-sans mb-3 relative z-10"
      >
        Who We Are
      </motion.p>
      
      {/* Static title */}
      <motion.h1
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0.2}
        className="font-heading text-4xl md:text-5xl text-white mb-5 relative z-10"
      >
        About Us
      </motion.h1>
      
      {/* Dynamic description */}
      <motion.p
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0.3}
        className="text-sm text-white/80 font-sans leading-relaxed max-w-md mx-auto relative z-10"
      >
        {loading ? (
          <span className="inline-block w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        ) : (
          data?.description || defaultDescription
        )}
      </motion.p>
      
      {/* Gold divider */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0.4}
        className="mt-8 mx-auto w-16 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent relative z-10"
      />
    </section>
  );
}
