"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative w-full h-[90vh] min-h-[580px] overflow-hidden bg-[#F9F9F9] pt-14">
      {/* Background image */}
      <Image
        src="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=1600&q=80"
        alt="Luxury apothecary products on marble surface"
        fill
        className="object-cover object-center"
        priority
      />

      {/* Gradient overlay — left side readable, right side reveals image */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#F9F9F9]/95 via-[#F9F9F9]/60 to-transparent" />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-lg">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-xs tracking-[0.3em] uppercase text-[#1A1A1A] font-sans mb-4"
            >
              Your Personal Pharmacy
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="font-heading text-4xl md:text-5xl text-[#1A1A1A] leading-tight mb-5"
            >
              Quality Healthcare,<br />
              Right at Your Door
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-sm text-[#6B6B6B] font-sans leading-relaxed mb-8 max-w-sm"
            >
              Discover curated medicines, skincare products, personal care essentials, and healthcare products. Find your nearest pharmacy.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Link
                href="/pharmacy"
                className="inline-flex items-center gap-2 bg-[#000000] text-white text-xs font-sans tracking-widest uppercase px-7 py-3 hover:bg-[#D4AF37] hover:text-black transition-all duration-300"
              >
                Explore Pharmacy
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom gold line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
    </section>
  );
}
