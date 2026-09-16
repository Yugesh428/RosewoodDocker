"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

// Types based on the AboutUs model
type AboutUs = {
  id: string;
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

const API_BASE = "/api/ui/about";

export default function AboutSection() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // ─── Fetch about data ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAbout = async () => {
      setLoading(true);
      try {
        const res = await fetch(API_BASE);
        const json: ApiResponse<AboutUs> = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to fetch about content");
        }
        setDescription(json.data?.description || "");
        setLastSaved(
          json.data?.updatedAt
            ? new Date(json.data.updatedAt).toLocaleString()
            : null,
        );
      } catch (err) {
        toast.error("Failed to load content", {
          description: err instanceof Error ? err.message : "Unknown error"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAbout();
  }, []);

  // ─── Save handler ──────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(API_BASE, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update about content");
      }
      toast.success("Content updated", {
        description: "About page content saved successfully."
      });
      setLastSaved(new Date().toLocaleString());
    } catch (err) {
      toast.error("Update failed", {
        description: err instanceof Error ? err.message : "Could not save changes"
      });
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 bg-[#F9F9F9] min-h-screen text-[#1A1A1A]">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-heading text-[#1A1A1A] mb-2">About Us</h1>
        <p className="text-[#6B6B6B] mb-6">
          Edit the content for the About Us page. This content is displayed as
          the main description (HTML allowed).
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-[#1A1A1A] mb-1"
              >
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                rows={12}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                placeholder="Write the about content here... You can use HTML tags for formatting."
              />
              <div className="flex justify-between items-center mt-1 text-xs text-[#6B6B6B]">
                <span>{description.length} characters</span>
                {lastSaved && <span>Last saved: {lastSaved}</span>}
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
              <button
                type="button"
                onClick={() => setShowPreview((prev) => !prev)}
                className="px-4 py-2 rounded-md border border-[#D4AF37] text-[#D4AF37] text-sm font-medium hover:bg-[#D4AF37]/10 transition-colors"
              >
                {showPreview ? "Hide Preview" : "Show Preview"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Reset to empty description?")) {
                    setDescription("");
                  }
                }}
                className="text-sm text-[#6B6B6B] hover:text-red-500 transition-colors"
              >
                Clear
              </button>
            </div>

            {showPreview && (
              <div className="mt-4 p-4 bg-white rounded-md border border-[#E5E5E5]">
                <h3 className="text-sm font-medium text-[#1A1A1A] mb-2">
                  Preview
                </h3>
                <div
                  className="prose prose-sm max-w-none text-[#1A1A1A]"
                  dangerouslySetInnerHTML={{
                    __html: description || "<em>Empty content</em>",
                  }}
                />
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
