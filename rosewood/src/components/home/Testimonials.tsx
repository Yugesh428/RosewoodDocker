"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    id: 1,
    stars: 5,
    text: "This apothecary truly exemplifies everything you want from a healthcare provider. The attention to detail and quality of products is unparalleled. Nothing short of extraordinary.",
    name: "Eleanor Voss",
    role: "Verified Customer",
    avatar: "EV",
  },
  {
    id: 2,
    stars: 5,
    text: "From shipping to incredible packaging, and incredible service — it's outstanding. I received exactly what I was promised and the experience exceeded every expectation.",
    name: "Maximilian Reed",
    role: "Verified Customer",
    avatar: "MR",
  },
  {
    id: 3,
    stars: 5,
    text: "I appreciate the excellent product descriptions and the clean, minimalist website. It makes finding exactly what you need for your family's wellness effortless.",
    name: "Sophia Laurent",
    role: "Verified Customer",
    avatar: "SL",
  },
];

function StarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="#D4AF37" stroke="#D4AF37" strokeWidth="1">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export default function Testimonials() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-xs tracking-[0.3em] uppercase text-[#1A1A1A] font-sans mb-3">
            What Our Clients Say
          </p>
          <h2 className="font-heading text-3xl text-[#1A1A1A]">Trusted by Our Community</h2>
          <p className="text-sm text-[#6B6B6B] font-sans mt-2 max-w-md mx-auto">
            Experience the difference of a pharmacy that prioritises your care, privacy, and well‑being.
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
              className="bg-[#F9F9F9] border border-[#E5E5E5] rounded-sm p-7 flex flex-col gap-4 hover:border-[#D4AF37]/60 hover:shadow-sm transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, s) => <StarIcon key={s} />)}
              </div>

              {/* Quote */}
              <p className="text-[#1A1A1A] text-sm font-sans leading-relaxed flex-1">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t border-[#E5E5E5]">
                <div className="w-9 h-9 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-semibold text-[#1A1A1A] font-sans">{t.avatar}</span>
                </div>
                <div>
                  <p className="text-[#1A1A1A] text-xs font-semibold font-sans">{t.name}</p>
                  <p className="text-[#6B6B6B] text-[10px] font-sans">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
