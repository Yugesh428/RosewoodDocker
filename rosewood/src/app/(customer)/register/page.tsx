"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

// ─── Eye toggle icon ──────────────────────────────────────────────────────────
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

// ─── Reusable input ───────────────────────────────────────────────────────────
const inputClass =
  "w-full border border-[#E5E5E5] bg-white text-sm text-[#1A1A1A] font-sans px-4 py-3 placeholder:text-[#ABABAB] focus:outline-none focus:border-[#D4AF37] transition-colors duration-200";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword]               = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed]                           = useState(false);
  const [error, setError]                             = useState<string | null>(null);
  const [loading, setLoading]                         = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!agreed) {
      setError("Please agree to the Terms and Conditions.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:     form.fullName.trim(),
          email:    form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
        return;
      }

      router.push("/login?registered=1");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9F9]">
      <div className="flex flex-1">

        {/* ── Left: Image panel ──────────────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80"
            alt="Luxe Apothecary store interior"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          {/* Text overlay */}
          <div className="absolute bottom-0 left-0 p-12">
            <div className="w-8 h-[1px] bg-[#D4AF37] mb-5" />
            <h2 className="font-heading text-3xl text-white leading-snug mb-3">
              Elevate Your<br />Wellness Ritual.
            </h2>
            <p className="text-sm text-white/70 font-sans leading-relaxed max-w-xs">
              Join an exclusive community dedicated to precision health and curated apothecary essentials.
            </p>
          </div>
        </div>

        {/* ── Right: Form panel ──────────────────────────────────────────── */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-16 bg-white">
          <div className="w-full max-w-md">

            {/* Heading */}
            <div className="mb-8">
              <h1 className="font-heading text-4xl text-[#1A1A1A] leading-tight mb-2">
                Create Your<br />Account
              </h1>
              <p className="text-sm text-[#6B6B6B] font-sans">
                Create an account to manage your pharmacy orders and preferences.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div role="alert" className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 font-sans">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-sans font-semibold tracking-[0.15em] uppercase text-[#1A1A1A]">
                  Full Name
                </label>
                <input
                  type="text" name="fullName" value={form.fullName}
                  onChange={handleChange} placeholder="Jane Doe"
                  required autoComplete="name"
                  className={inputClass}
                />
              </div>

              {/* Email + Phone row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-sans font-semibold tracking-[0.15em] uppercase text-[#1A1A1A]">
                    Email
                  </label>
                  <input
                    type="email" name="email" value={form.email}
                    onChange={handleChange} placeholder="jane@example.com"
                    required autoComplete="email"
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-sans font-semibold tracking-[0.15em] uppercase text-[#1A1A1A]">
                    Phone
                  </label>
                  <input
                    type="tel" name="phone" value={form.phone}
                    onChange={handleChange} placeholder="+1 (555) 000-0000"
                    autoComplete="tel"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-sans font-semibold tracking-[0.15em] uppercase text-[#1A1A1A]">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password" value={form.password}
                    onChange={handleChange} placeholder="••••••••"
                    required minLength={8} autoComplete="new-password"
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button" onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center px-3.5 text-[#ABABAB] hover:text-[#6B6B6B] transition-colors"
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-sans font-semibold tracking-[0.15em] uppercase text-[#1A1A1A]">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword" value={form.confirmPassword}
                    onChange={handleChange} placeholder="••••••••"
                    required autoComplete="new-password"
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button" onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center px-3.5 text-[#ABABAB] hover:text-[#6B6B6B] transition-colors"
                  >
                    <EyeIcon open={showConfirmPassword} />
                  </button>
                </div>
              </div>

              {/* Terms checkbox */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox" checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 border border-[#E5E5E5] accent-[#D4AF37] cursor-pointer flex-shrink-0"
                />
                <span className="text-xs text-[#6B6B6B] font-sans leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" className="text-[#1A1A1A] underline underline-offset-2 hover:text-[#D4AF37] transition-colors">
                    Terms and Conditions
                  </Link>
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                className="w-full bg-[#1A1A1A] text-white text-xs font-sans tracking-[0.2em] uppercase py-4 flex items-center justify-center gap-2 hover:bg-[#D4AF37] hover:text-black transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              >
                {loading ? "Creating Account…" : (
                  <>
                    Create Account
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Login link */}
            <p className="mt-6 text-center text-xs text-[#6B6B6B] font-sans">
              Already have an account?{" "}
              <Link href="/login" className="text-[#1A1A1A] font-semibold underline underline-offset-2 hover:text-[#D4AF37] transition-colors">
                Login
              </Link>
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}
