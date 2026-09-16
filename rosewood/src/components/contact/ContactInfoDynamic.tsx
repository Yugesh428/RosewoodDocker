"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type ContactInfo = {
  id: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
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

export default function ContactInfoDynamic() {
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
      .catch((err) => console.error("Failed to load contact info:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        custom={0.15}
        className="flex flex-col gap-8"
      >
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      </motion.div>
    );
  }

  if (!data) return null;

  // Parse address into lines
  const addressLines = data.address.split('\n').filter(line => line.trim());

  // Parse hours into lines
  const hoursLines = data.hours.split('\n').filter(line => line.trim());

  const contactInfo = [
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
      label: "Address",
      lines: addressLines,
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      ),
      label: "Phone",
      lines: [data.phone],
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      ),
      label: "Email",
      lines: [data.email],
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      label: "Opening Hours",
      lines: hoursLines,
    },
  ];

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      custom={0.15}
      className="flex flex-col gap-8"
    >
      <div>
        <h2 className="font-heading text-2xl text-[#1A1A1A] mb-6">
          Contact Information
        </h2>

        <div className="flex flex-col gap-6">
          {contactInfo.map((item) => (
            <div key={item.label} className="flex gap-4 items-start">
              {/* Icon */}
              <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                {item.icon}
              </div>
              {/* Text */}
              <div>
                <p className="text-xs font-sans font-semibold text-[#1A1A1A] tracking-wide mb-1">
                  {item.label}
                </p>
                {item.lines.map((line, idx) => (
                  <p key={idx} className="text-sm text-[#6B6B6B] font-sans leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
