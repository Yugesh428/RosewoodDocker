"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";

// Types based on the Mission model
type Mission = {
  id: string;
  subtitle: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

// API response shape
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

const API_BASE = "/api/ui/mission";

export default function MissionSection() {
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // ─── Fetch mission data ─────────────────────────────────────────────────────
  useEffect(() => {
    const fetchMission = async () => {
      setLoading(true);
      try {
        const res = await fetch(API_BASE);
        const json: ApiResponse<Mission> = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to fetch mission content");
        }
        setSubtitle(json.data?.subtitle || "");
        setDescription(json.data?.description || "");
        setLastSaved(
          json.data?.updatedAt
            ? new Date(json.data.updatedAt).toLocaleString()
            : null,
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchMission();
  }, []);

  // ─── Save handler ──────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload: { subtitle?: string; description?: string } = {};
      if (subtitle.trim()) payload.subtitle = subtitle.trim();
      if (description.trim()) payload.description = description.trim();

      const res = await fetch(API_BASE, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update mission content");
      }
      toast.success("Mission content updated successfully!");
      setLastSaved(new Date().toLocaleString());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 bg-[#F9F9F9] min-h-screen text-[#1A1A1A]">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-heading text-[#1A1A1A] mb-2">
          Our Mission
        </h1>
        <p className="text-[#6B6B6B] mb-6">
          Edit the mission subtitle and description. Both fields are required
          and displayed on the frontend.
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Subtitle */}
            <div>
              <label
                htmlFor="subtitle"
                className="block text-sm font-medium text-[#1A1A1A] mb-1"
              >
                Subtitle (Heading) <span className="text-red-500">*</span>
              </label>
              <input
                id="subtitle"
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                required
                className="w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                placeholder="e.g. A Higher Standard of Care"
              />
              <div className="flex justify-between items-center mt-1 text-xs text-[#6B6B6B]">
                <span>{subtitle.length} characters</span>
                <button
                  type="button"
                  onClick={() => setSubtitle("")}
                  className="text-[#6B6B6B] hover:text-red-500"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-[#1A1A1A] mb-1"
              >
                Description (Quote) <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                placeholder="Write the mission statement here..."
              />
              <div className="flex justify-between items-center mt-1 text-xs text-[#6B6B6B]">
                <span>{description.length} characters</span>
                <button
                  type="button"
                  onClick={() => setDescription("")}
                  className="text-[#6B6B6B] hover:text-red-500"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 rounded-md bg-[#D4AF37] text-white text-sm font-medium hover:bg-[#b8972e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              {lastSaved && (
                <span className="text-xs text-[#6B6B6B]">
                  Last saved: {lastSaved}
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
