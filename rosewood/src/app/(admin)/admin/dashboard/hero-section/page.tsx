import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import HeroSection from "@/components/publicPages/HomePage/heroSection";
import { ImageIcon } from "lucide-react";

export default async function HeroSectionPage() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    redirect("/admin/login");
  }

  return (
    <AdminLayout>
      {/* ── Sticky page header ─────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-sm"
              style={{ background: "linear-gradient(135deg, #1c1c1c, #141414)" }}
            >
              <ImageIcon className="w-4 h-4" style={{ color: "#D4AF37" }} />
            </div>
            <div>
              <h1 className="text-2xl font-heading text-gray-900">Hero Section</h1>
              <p className="text-sm text-gray-500 mt-0.5 font-sans">
                Manage homepage hero carousel slides
              </p>
            </div>
          </div>

          <a
            href="/admin/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700 font-sans flex items-center gap-1.5 transition-colors"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>

      {/* ── Client component ───────────────────────────────────────────────── */}
      <HeroSection />
    </AdminLayout>
  );
}
