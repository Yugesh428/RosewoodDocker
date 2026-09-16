/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";

// Types based on the OurStory model
type OurStory = {
  id: string;
  imageUrl: string | null;
  title: string;
  paragraph1: string;
  paragraph2: string | null;
  paragraph3: string | null;
  createdAt: string;
  updatedAt: string;
};

// API response shape
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

const API_BASE = "/api/ui/our-story";

export default function OurStorySection() {
  const [story, setStory] = useState<OurStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [paragraph1, setParagraph1] = useState("");
  const [paragraph2, setParagraph2] = useState("");
  const [paragraph3, setParagraph3] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null); // current URL (existing)
  const [imageFile, setImageFile] = useState<File | null>(null); // new file to upload
  const [imagePreview, setImagePreview] = useState<string | null>(null); // for previewing new file
  const [removeImage, setRemoveImage] = useState(false);

  // ─── Fetch story data ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchStory = async () => {
      setLoading(true);
      try {
        const res = await fetch(API_BASE);
        const json: ApiResponse<OurStory> = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to fetch story");
        }
        const data = json.data!;
        setStory(data);
        setTitle(data.title);
        setParagraph1(data.paragraph1);
        setParagraph2(data.paragraph2 || "");
        setParagraph3(data.paragraph3 || "");
        setImageUrl(data.imageUrl);
        setImagePreview(null);
        setImageFile(null);
        setRemoveImage(false);
        setLastSaved(
          data.updatedAt ? new Date(data.updatedAt).toLocaleString() : null,
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchStory();
  }, []);

  // ─── Image handlers ────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setRemoveImage(false);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    // Clear the file input
    const input = document.getElementById("imageInput") as HTMLInputElement;
    if (input) input.value = "";
  };

  // ─── Save handler ──────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload: any = {
        title: title.trim(),
        paragraph1: paragraph1.trim(),
        paragraph2: paragraph2.trim() || undefined,
        paragraph3: paragraph3.trim() || undefined,
      };

      // If we want to remove the image, set imageUrl to null
      if (removeImage) {
        payload.imageUrl = null;
      }

      let body: FormData | string;
      let headers: HeadersInit = {};

      // If we have a new image file, use FormData
      if (imageFile) {
        const form = new FormData();
        form.append("image", imageFile);
        form.append("title", payload.title);
        form.append("paragraph1", payload.paragraph1);
        if (payload.paragraph2) form.append("paragraph2", payload.paragraph2);
        if (payload.paragraph3) form.append("paragraph3", payload.paragraph3);
        if (removeImage) form.append("imageUrl", "null"); // not needed as we don't send image
        // But if we want to explicitly set null, we can send imageUrl=null as string?
        // The API expects imageUrl field in fields for JSON; for FormData, we can send it as a field.
        if (removeImage) form.append("imageUrl", "null");
        body = form;
      } else {
        // JSON: send all fields
        payload.imageUrl = imageUrl; // existing URL (or null if removed)
        if (removeImage) payload.imageUrl = null;
        body = JSON.stringify(payload);
        headers["Content-Type"] = "application/json";
      }

      const res = await fetch(API_BASE, {
        method: "PUT",
        headers,
        body,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update story");
      }

      // Update local state with new data
      const updated = json.data;
      setStory(updated);
      setImageUrl(updated.imageUrl);
      setImageFile(null);
      setImagePreview(null);
      setRemoveImage(false);
      setLastSaved(
        updated.updatedAt ? new Date(updated.updatedAt).toLocaleString() : null,
      );
      toast.success("Story updated successfully!");
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
        <h1 className="text-3xl font-heading text-[#1A1A1A] mb-2">Our Story</h1>
        <p className="text-[#6B6B6B] mb-6">
          Edit the story content and image. Paragraph 1 is required; paragraphs
          2 and 3 are optional.
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Image section */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                Image (optional)
              </label>
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1">
                  <input
                    id="imageInput"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={handleFileChange}
                    className="w-full text-sm text-[#6B6B6B] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#D4AF37] file:text-white hover:file:bg-[#b8972e]"
                  />
                  <p className="text-xs text-[#6B6B6B] mt-1">
                    JPEG, PNG, WebP, AVIF, max 5 MB
                  </p>
                </div>
                {(imageUrl || imagePreview) && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    Remove image
                  </button>
                )}
              </div>

              {/* Image preview */}
              {(imagePreview || imageUrl) && !removeImage && (
                <div className="mt-2 w-48 h-48 relative bg-[#F9F9F9] rounded-md overflow-hidden border border-[#E5E5E5]">
                  <Image
                    src={imagePreview || imageUrl!}
                    alt="Story image preview"
                    fill
                    className="object-cover"
                    sizes="192px"
                  />
                </div>
              )}
              {removeImage && (
                <div className="mt-2 text-sm text-[#6B6B6B]">
                  Image will be removed.
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-[#1A1A1A] mb-1"
              >
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                placeholder="e.g. Born from a Desire to Redefine the Pharmacy"
              />
              <div className="text-xs text-[#6B6B6B] mt-1">
                {title.length} characters
              </div>
            </div>

            {/* Paragraph 1 */}
            <div>
              <label
                htmlFor="paragraph1"
                className="block text-sm font-medium text-[#1A1A1A] mb-1"
              >
                Paragraph 1 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="paragraph1"
                rows={4}
                value={paragraph1}
                onChange={(e) => setParagraph1(e.target.value)}
                required
                className="w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                placeholder="Origin story..."
              />
              <div className="text-xs text-[#6B6B6B] mt-1">
                {paragraph1.length} characters
              </div>
            </div>

            {/* Paragraph 2 */}
            <div>
              <label
                htmlFor="paragraph2"
                className="block text-sm font-medium text-[#1A1A1A] mb-1"
              >
                Paragraph 2 (optional)
              </label>
              <textarea
                id="paragraph2"
                rows={3}
                value={paragraph2}
                onChange={(e) => setParagraph2(e.target.value)}
                className="w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                placeholder="Additional story..."
              />
              <div className="text-xs text-[#6B6B6B] mt-1">
                {paragraph2.length} characters
              </div>
            </div>

            {/* Paragraph 3 */}
            <div>
              <label
                htmlFor="paragraph3"
                className="block text-sm font-medium text-[#1A1A1A] mb-1"
              >
                Paragraph 3 (optional)
              </label>
              <textarea
                id="paragraph3"
                rows={3}
                value={paragraph3}
                onChange={(e) => setParagraph3(e.target.value)}
                className="w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                placeholder="Team or belief statement..."
              />
              <div className="text-xs text-[#6B6B6B] mt-1">
                {paragraph3.length} characters
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
