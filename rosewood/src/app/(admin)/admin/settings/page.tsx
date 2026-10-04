"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user) {
      router.push("/admin/login");
      return;
    }

    const user = session.user as { role?: string };
    if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
      router.push("/admin/dashboard");
      return;
    }

    setLoading(false);
  }, [session, status, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your application settings and preferences
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h2>
            <p className="text-sm text-gray-600">
              Settings configuration is currently under development.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Application:</strong> Pharmacy Nepal</p>
              <p><strong>Version:</strong> 1.0.0</p>
              <p><strong>Environment:</strong> {process.env.NODE_ENV || "development"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
