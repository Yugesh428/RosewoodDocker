"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";

const tabs = ["All", "Skincare", "Wellness", "Personal Care"];

const collections = [
  {
    id: 1,
    title: "Advanced Skincare Regime",
    category: "Skincare",
    image: "https://images.unsplash.com/photo-1570194065650-d99fb4b8ccb0?w=800&q=80",
  },
  {
    id: 2,
    title: "Herbal Extracts",
    category: "Wellness",
    image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&q=80",
  },
  {
    id: 3,
    title: "First Aid Essentials",
    category: "Personal Care",
    image: "https://images.unsplash.com/photo-1576671081837-49000212a370?w=400&q=80",
  },
];

export default function ProductCollection() {
  const [activeTab, setActiveTab] = useState("All");

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="font-heading text-3xl text-[#1A1A1A]">Our Product Collection</h2>
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-sans px-5 py-2 rounded-sm border transition-all duration-200 ${
                activeTab === tab
                  ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                  : "bg-white text-[#6B6B6B] border-[#E5E5E5] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Mosaic grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Large card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:col-span-2 relative group overflow-hidden rounded-sm h-80 md:h-96 cursor-pointer"
          >
            <Image
              src={collections[0].image}
              alt={collections[0].title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              <p className="text-[10px] tracking-[0.25em] uppercase text-[#D4AF37] font-sans mb-1">
                {collections[0].category}
              </p>
              <h3 className="font-heading text-xl text-white mb-3">{collections[0].title}</h3>
              <Link
                href="/pharmacy"
                className="inline-flex items-center gap-1.5 text-xs font-sans text-white border border-white/50 px-4 py-2 hover:bg-white hover:text-black transition-all duration-200"
              >
                Shop Category
              </Link>
            </div>
          </motion.div>

          {/* Small cards */}
          <div className="flex flex-col gap-4">
            {collections.slice(1).map((col, i) => (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative group overflow-hidden rounded-sm flex-1 min-h-44 cursor-pointer"
              >
                <Image
                  src={col.image}
                  alt={col.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#D4AF37] font-sans mb-0.5">
                    {col.category}
                  </p>
                  <h3 className="font-heading text-sm text-white">{col.title}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* View all */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link
            href="/pharmacy"
            className="inline-flex items-center gap-2 text-xs font-sans tracking-widest uppercase text-[#1A1A1A] border border-[#1A1A1A] px-8 py-3 hover:bg-[#1A1A1A] hover:text-white transition-all duration-300"
          >
            View All Products
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
