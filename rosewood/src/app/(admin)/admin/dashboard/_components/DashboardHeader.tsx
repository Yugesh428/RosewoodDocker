"use client";

import { useRouter } from "next/navigation";
import { Package } from "lucide-react";

interface DashboardHeaderProps {
  userName: string | null | undefined;
}

export default function DashboardHeader({ userName }: DashboardHeaderProps) {
  const router = useRouter();

  return (
    <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading text-gray-900">Dashboard Overview</h1>
            <p className="text-sm text-gray-500 mt-1 font-sans">
              Welcome back, {userName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Add Product — the only dashboard action shortcut */}
            <button
              className="flex items-center gap-2 px-4 py-2 text-black text-sm font-semibold rounded-sm transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #D4AF37 0%, #ffe87c 50%, #b8952e 100%)",
                boxShadow: "0 2px 10px rgba(212,175,55,0.35)",
              }}
              onClick={() => router.push("/admin/products/new")}
            >
              <Package className="w-4 h-4" />
              Add New Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
