"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type ContactInfo = {
  latitude: number | null;
  longitude: number | null;
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: "easeOut" },
  }),
};

export default function ContactMapDynamic() {
  const [data, setData] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ui/contact-info")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setData(json.data);
        }
      })
      .catch((err) => console.error("Failed to load map coordinates:", err))
      .finally(() => setLoading(false));
  }, []);

  // Default coordinates (New York)
  const lat = data?.latitude || 40.7165;
  const lon = data?.longitude || -74.0005;

  // Calculate bounding box for the map
  const offset = 0.005;
  const bbox = `${lon - offset}%2C${lat - offset}%2C${lon + offset}%2C${lat + offset}`;

  if (loading) {
    return (
      <section className="bg-[#F9F9F9] pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-96 flex items-center justify-center bg-white border border-[#E5E5E5] rounded-sm">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#F9F9F9] pb-16">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          className="overflow-hidden rounded-sm border border-[#E5E5E5]"
        >
          <iframe
            title="Store location"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`}
            width="100%"
            height="380"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </motion.div>
      </div>
    </section>
  );
}
