"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";

// Types based on the ContactInfo model
type ContactInfo = {
  id: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
};

// API response shape
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

const API_BASE = "/api/ui/contact-info";

export default function ContactInfoSection() {
  // Form state
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [hours, setHours] = useState("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // ─── Fetch contact info ─────────────────────────────────────────────────────
  useEffect(() => {
    const fetchContactInfo = async () => {
      setLoading(true);
      try {
        const res = await fetch(API_BASE);
        const json: ApiResponse<ContactInfo> = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to fetch contact info");
        }
        const data = json.data!;
        setAddress(data.address);
        setPhone(data.phone);
        setEmail(data.email);
        setHours(data.hours);
        setLatitude(data.latitude !== null ? String(data.latitude) : "");
        setLongitude(data.longitude !== null ? String(data.longitude) : "");
        setLastSaved(
          data.updatedAt ? new Date(data.updatedAt).toLocaleString() : null,
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchContactInfo();
  }, []);

  // ─── Save handler ──────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Validation
    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error("Invalid email address.");
      setSaving(false);
      return;
    }

    const latNum = latitude.trim() ? Number(latitude) : null;
    const lngNum = longitude.trim() ? Number(longitude) : null;
    if (latitude.trim() && (isNaN(latNum!) || latNum! < -90 || latNum! > 90)) {
      toast.error("Latitude must be a number between -90 and 90.");
      setSaving(false);
      return;
    }
    if (
      longitude.trim() &&
      (isNaN(lngNum!) || lngNum! < -180 || lngNum! > 180)
    ) {
      toast.error("Longitude must be a number between -180 and 180.");
      setSaving(false);
      return;
    }

    try {
      const payload: Record<string, string | number> = {};
      if (address.trim()) payload.address = address.trim();
      if (phone.trim()) payload.phone = phone.trim();
      if (trimmedEmail) payload.email = trimmedEmail;
      if (hours.trim()) payload.hours = hours.trim();
      if (latitude.trim()) payload.latitude = latNum!;
      if (longitude.trim()) payload.longitude = lngNum!;

      const res = await fetch(API_BASE, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update contact info");
      }
      toast.success("Contact information updated successfully!");
      setLastSaved(new Date().toLocaleString());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  // ─── Map link ──────────────────────────────────────────────────────────────
  const mapLink = (() => {
    const lat = latitude.trim() ? Number(latitude) : null;
    const lng = longitude.trim() ? Number(longitude) : null;
    if (
      lat !== null &&
      !isNaN(lat) &&
      lng !== null &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      return `https://www.google.com/maps?q=${lat},${lng}`;
    }
    return null;
  })();

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 bg-[#F9F9F9] min-h-screen text-[#1A1A1A]">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-heading text-[#1A1A1A] mb-2">
          Contact Information
        </h1>
        <p className="text-[#6B6B6B] mb-6">
          Update the contact details displayed on the public contact page.
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            {/* Address */}
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-[#1A1A1A]"
              >
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="address"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                placeholder="Street address, city, state, zip"
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-[#1A1A1A]"
              >
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                placeholder="+1 (212) 555-0199"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#1A1A1A]"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                placeholder="concierge@rosewoodpharmacy.com"
              />
            </div>

            {/* Hours */}
            <div>
              <label
                htmlFor="hours"
                className="block text-sm font-medium text-[#1A1A1A]"
              >
                Opening Hours <span className="text-red-500">*</span>
              </label>
              <textarea
                id="hours"
                rows={4}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                placeholder="Monday – Friday: 9:00 AM – 7:00 PM&#10;Saturday: 10:00 AM – 5:00 PM&#10;Sunday: Closed"
              />
            </div>

            {/* Latitude / Longitude */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="latitude"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Latitude (optional)
                </label>
                <input
                  id="latitude"
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  placeholder="e.g. 40.7165"
                />
              </div>
              <div>
                <label
                  htmlFor="longitude"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Longitude (optional)
                </label>
                <input
                  id="longitude"
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  placeholder="e.g. -74.0005"
                />
              </div>
            </div>

            {/* Map preview */}
            {mapLink && (
              <div className="p-3 bg-white rounded-md border border-[#E5E5E5]">
                <p className="text-sm text-[#6B6B6B]">
                  📍{" "}
                  <a
                    href={mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#D4AF37] hover:underline"
                  >
                    View on Google Maps
                  </a>
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 pt-2">
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
