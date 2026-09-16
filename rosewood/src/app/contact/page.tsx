"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/home/Footer";
import ContactInfoDynamic from "@/components/contact/ContactInfoDynamic";
import ContactMapDynamic from "@/components/contact/ContactMapDynamic";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: "easeOut" },
  }),
};

export default function ContactPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/ui/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to send message");
      }
      setStatus("sent");
      setForm({ fullName: "", email: "", phone: "", message: "" });
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div style={{ backgroundColor: "#ffffff" }}>
      <Navbar />

      <main className="min-h-screen pt-20">

        {/* ── Two-column content ─────────────────────────────────────────── */}
        <section className="py-16" style={{ backgroundColor: "transparent" }}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

              {/* ── Left: Contact Form ──────────────────────────────────── */}
              <motion.div
                variants={fadeUp} initial="hidden" whileInView="visible"
                viewport={{ once: true }} custom={0}
                className="bg-white border border-[#E5E5E5] rounded-sm p-8 md:p-10"
              >
                <h2 className="font-heading text-2xl text-[#1A1A1A] mb-7">
                  Send a Message
                </h2>

                {status === "sent" ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center mx-auto mb-4">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <p className="font-heading text-lg text-[#1A1A1A] mb-2">Message Sent</p>
                    <p className="text-xs text-[#6B6B6B] font-sans">
                      Thank you for reaching out. We will respond within 24 hours.
                    </p>
                    <button
                      onClick={() => setStatus("idle")}
                      className="mt-6 text-xs font-sans tracking-widest uppercase text-[#D4AF37] hover:text-[#1A1A1A] transition-colors duration-200"
                    >
                      Send Another
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {/* Row: Name + Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-sans text-[#1A1A1A] tracking-wide">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={form.fullName}
                          onChange={handleChange}
                          placeholder="Jane Doe"
                          required
                          className="border border-[#E5E5E5] bg-[#F9F9F9] text-sm text-[#1A1A1A] font-sans px-4 py-2.5 rounded-sm placeholder:text-[#ABABAB] focus:outline-none focus:border-[#D4AF37] transition-colors duration-200"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-sans text-[#1A1A1A] tracking-wide">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="jane@example.com"
                          required
                          className="border border-[#E5E5E5] bg-[#F9F9F9] text-sm text-[#1A1A1A] font-sans px-4 py-2.5 rounded-sm placeholder:text-[#ABABAB] focus:outline-none focus:border-[#D4AF37] transition-colors duration-200"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-sans text-[#1A1A1A] tracking-wide">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="+1 (555) 000-0000"
                        className="border border-[#E5E5E5] bg-[#F9F9F9] text-sm text-[#1A1A1A] font-sans px-4 py-2.5 rounded-sm placeholder:text-[#ABABAB] focus:outline-none focus:border-[#D4AF37] transition-colors duration-200"
                      />
                    </div>

                    {/* Message */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-sans text-[#1A1A1A] tracking-wide">
                        Message
                      </label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        placeholder="How can we help you today?"
                        required
                        rows={5}
                        className="border border-[#E5E5E5] bg-[#F9F9F9] text-sm text-[#1A1A1A] font-sans px-4 py-2.5 rounded-sm placeholder:text-[#ABABAB] focus:outline-none focus:border-[#D4AF37] transition-colors duration-200 resize-y"
                      />
                    </div>

                    {/* Error state */}
                    {status === "error" && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-sm text-xs text-red-700 font-sans">
                        {errorMsg || "Something went wrong. Please try again."}
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={status === "sending"}
                      onClick={() => status === "error" && setStatus("idle")}
                      className="mt-2 w-full bg-[#1A1A1A] text-white text-xs font-sans tracking-widest uppercase py-3.5 hover:bg-[#D4AF37] hover:text-black transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {status === "sending" ? "Sending…" : "Send Message"}
                    </button>
                  </form>
                )}
              </motion.div>

              {/* ── Right: Contact Info (Dynamic) ────────────────────────────────── */}
              <ContactInfoDynamic />

            </div>
          </div>
        </section>

        {/* ── Full-width Map (Dynamic) ─────────────────────────────────────────────── */}
        <ContactMapDynamic />

        {/* Gold line */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
      </main>

      <Footer />
    </div>
  );
}
