"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { toast } from "sonner";
import { Palette, Check, Plus, Trash2, Edit2, X } from "lucide-react";

interface CustomTheme {
  id: string;
  name: string;
  isDefault: boolean;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryText: string;
  bgPage: string;
  bgGradient: string;
  bgCard: string;
  bgNav: string;
  textHeading: string;
  textBody: string;
  textMuted: string;
  borderColor: string;
  shadow: string;
  shadowHover: string;
}

const DEFAULT_THEMES = [
  {
    id: "gold",
    name: "Gold & Black",
    isDefault: true,
    primary: "#D4AF37",
    primaryLight: "#ffe87c",
    primaryDark: "#b8952e",
    primaryText: "#000000",
    bgPage: "#F9F9F9",
    bgGradient: "linear-gradient(135deg, #fdf9ee 0%, #f9f9f9 50%, #f5f2e8 100%)",
    bgCard: "#ffffff",
    bgNav: "#000000",
    textHeading: "#1A1A1A",
    textBody: "#374151",
    textMuted: "#6B6B6B",
    borderColor: "#E8E4DC",
    shadow: "0 2px 12px rgba(0,0,0,0.08)",
    shadowHover: "0 8px 28px rgba(0,0,0,0.15)",
  },
  {
    id: "medical",
    name: "Medical Blue",
    isDefault: true,
    primary: "#00B4D8",
    primaryLight: "#90E0EF",
    primaryDark: "#0096C7",
    primaryText: "#ffffff",
    bgPage: "#EAF6FB",
    bgGradient: "linear-gradient(135deg, #e0f4fb 0%, #f0faff 40%, #e8f5f0 100%)",
    bgCard: "#ffffff",
    bgNav: "#023E8A",
    textHeading: "#023E8A",
    textBody: "#1a4a6b",
    textMuted: "#4a7a96",
    borderColor: "#CAE9F5",
    shadow: "0 2px 12px rgba(0,100,160,0.10)",
    shadowHover: "0 8px 28px rgba(0,100,160,0.20)",
  },
];

export default function ThemeSettingsPage() {
  const { theme, homeBg, setTheme, setHomeBg, loading: themeLoading, refreshTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [savingBg, setSavingBg] = useState(false);
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
  const [loadingThemes, setLoadingThemes] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTheme, setEditingTheme] = useState<CustomTheme | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch all custom themes
  async function fetchCustomThemes() {
    try {
      const res = await fetch("/api/custom-themes");
      const json = await res.json();
      if (json.success) {
        setCustomThemes(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch custom themes:", err);
    } finally {
      setLoadingThemes(false);
    }
  }

  useEffect(() => {
    fetchCustomThemes();
  }, []);

  async function handleSelectTheme(themeId: string) {
    if (theme?.id === themeId || saving) return;
    setSaving(true);
    try {
      await setTheme(themeId);
      const selectedTheme = [...DEFAULT_THEMES, ...customThemes].find(t => t.id === themeId);
      toast.success(`Theme changed to "${selectedTheme?.name || "Selected theme"}"`);
    } catch (error) {
      console.error("Failed to change theme:", error);
      toast.error("Failed to save theme.");
    } finally {
      setSaving(false);
    }
  }

  async function handleHomeBgChange(bg: "blue" | "white" | "soft-blue" | "near-blue" | "creamy-blue") {
    if (savingBg) return;
    setSavingBg(true);
    try {
      await setHomeBg(bg);
      const label = bg === "blue" ? "Blue" : bg === "near-blue" ? "Near Blue" : bg === "creamy-blue" ? "Creamy Blue" : bg === "soft-blue" ? "Soft Blue" : "White";
      toast.success(`Homepage background set to ${label}`);
    } catch {
      toast.error("Failed to update homepage background");
    } finally {
      setSavingBg(false);
    }
  }

  async function handleDeleteTheme(themeId: string) {
    if (!confirm("Are you sure you want to delete this custom theme?")) return;
    
    setDeletingId(themeId);
    try {
      const res = await fetch(`/api/custom-themes/${themeId}`, { method: "DELETE" });
      const json = await res.json();
      
      if (json.success) {
        toast.success("Theme deleted successfully");
        await fetchCustomThemes();
        
        // If deleted theme was active, switch to gold
        if (theme?.id === themeId) {
          await setTheme("gold");
        }
      } else {
        toast.error(json.message || "Failed to delete theme");
      }
    } catch (err) {
      toast.error("Failed to delete theme");
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  }

  function handleCreateNew() {
    setEditingTheme(null);
    setShowCreateModal(true);
  }

  function handleEditTheme(theme: CustomTheme) {
    setEditingTheme(theme);
    setShowCreateModal(true);
  }

  async function handleSaveTheme(themeData: Partial<CustomTheme>) {
    try {
      const url = editingTheme 
        ? `/api/custom-themes/${editingTheme.id}` 
        : "/api/custom-themes";
      const method = editingTheme ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(themeData),
      });
      
      const json = await res.json();
      
      if (json.success) {
        toast.success(editingTheme ? "Theme updated successfully" : "Theme created successfully");
        await fetchCustomThemes();
        await refreshTheme();
        setShowCreateModal(false);
        setEditingTheme(null);
      } else {
        toast.error(json.message || "Failed to save theme");
      }
    } catch (err) {
      toast.error("Failed to save theme");
      console.error(err);
    }
  }

  const allThemes = [...DEFAULT_THEMES, ...customThemes];

  // Filter out duplicates - if a custom theme has same ID as default, it's the seeded one
  const defaultThemesOnly = DEFAULT_THEMES;
  const customThemesOnly = customThemes.filter(t => !t.isDefault);

  return (
    <div className="p-8 bg-[#F8F8F8] min-h-screen">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-sm"
              style={{ background: "linear-gradient(135deg, #1c1c1c, #141414)" }}>
              <Palette className="w-4 h-4" style={{ color: "#D4AF37" }} />
            </div>
            <h1 className="text-2xl font-heading text-gray-900">Theme Settings</h1>
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-black rounded-sm text-sm font-semibold hover:bg-[#b8952e] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Custom Theme
          </button>
        </div>
        <p className="text-sm text-gray-500 font-sans ml-11">
          Choose the colour theme displayed to all visitors on the public site.
          Changes take effect immediately — no restart needed.
        </p>
      </div>

      {/* Homepage Background Section */}
      <div className="mb-8 p-5 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">Homepage Background</h2>
        <p className="text-xs text-gray-400 font-sans mb-4">Choose the background colour for the homepage only.</p>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Blue */}
          <button
            onClick={() => handleHomeBgChange("blue")}
            disabled={savingBg}
            className="flex items-center gap-3 px-5 py-3 rounded-lg border-2 transition-all font-sans text-sm font-semibold disabled:opacity-50"
            style={{
              borderColor: homeBg === "blue" ? "#D4AF37" : "#E5E5E5",
              boxShadow: homeBg === "blue" ? "0 0 0 3px rgba(212,175,55,0.2)" : undefined,
              backgroundColor: "#dff0fb",
              color: "#1A1A1A",
            }}
          >
            <span className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: "#dff0fb" }} />
            Blue
            {homeBg === "blue" && <Check className="w-4 h-4 text-[#D4AF37]" />}
          </button>

          {/* Near Blue */}
          <button
            onClick={() => handleHomeBgChange("near-blue")}
            disabled={savingBg}
            className="flex items-center gap-3 px-5 py-3 rounded-lg border-2 transition-all font-sans text-sm font-semibold disabled:opacity-50"
            style={{
              borderColor: homeBg === "near-blue" ? "#D4AF37" : "#E5E5E5",
              boxShadow: homeBg === "near-blue" ? "0 0 0 3px rgba(212,175,55,0.2)" : undefined,
              backgroundColor: "#cce8f7",
              color: "#1A1A1A",
            }}
          >
            <span className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: "#cce8f7" }} />
            Near Blue
            {homeBg === "near-blue" && <Check className="w-4 h-4 text-[#D4AF37]" />}
          </button>

          {/* Soft Blue */}
          <button
            onClick={() => handleHomeBgChange("soft-blue")}
            disabled={savingBg}
            className="flex items-center gap-3 px-5 py-3 rounded-lg border-2 transition-all font-sans text-sm font-semibold disabled:opacity-50"
            style={{
              borderColor: homeBg === "soft-blue" ? "#D4AF37" : "#E5E5E5",
              boxShadow: homeBg === "soft-blue" ? "0 0 0 3px rgba(212,175,55,0.2)" : undefined,
              backgroundColor: "#f0f8ff",
              color: "#1A1A1A",
            }}
          >
            <span className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: "#f0f8ff" }} />
            Soft Blue
            {homeBg === "soft-blue" && <Check className="w-4 h-4 text-[#D4AF37]" />}
          </button>

          {/* Creamy Blue */}
          <button
            onClick={() => handleHomeBgChange("creamy-blue")}
            disabled={savingBg}
            className="flex items-center gap-3 px-5 py-3 rounded-lg border-2 transition-all font-sans text-sm font-semibold disabled:opacity-50"
            style={{
              borderColor: homeBg === "creamy-blue" ? "#D4AF37" : "#E5E5E5",
              boxShadow: homeBg === "creamy-blue" ? "0 0 0 3px rgba(212,175,55,0.2)" : undefined,
              backgroundColor: "#e8f4f8",
              color: "#1A1A1A",
            }}
          >
            <span className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: "#e8f4f8" }} />
            Creamy Blue
            {homeBg === "creamy-blue" && <Check className="w-4 h-4 text-[#D4AF37]" />}
          </button>

          {/* White */}
          <button
            onClick={() => handleHomeBgChange("white")}
            disabled={savingBg}
            className="flex items-center gap-3 px-5 py-3 rounded-lg border-2 transition-all font-sans text-sm font-semibold disabled:opacity-50"
            style={{
              borderColor: homeBg === "white" ? "#D4AF37" : "#E5E5E5",
              boxShadow: homeBg === "white" ? "0 0 0 3px rgba(212,175,55,0.2)" : undefined,
              backgroundColor: "#ffffff",
              color: "#1A1A1A",
            }}
          >
            <span className="w-6 h-6 rounded-full border-2 border-gray-200 shadow-sm" style={{ backgroundColor: "#ffffff" }} />
            White
            {homeBg === "white" && <Check className="w-4 h-4 text-[#D4AF37]" />}
          </button>

          {savingBg && (
            <div className="w-5 h-5 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
          )}
        </div>
      </div>

      {/* Theme Cards */}
      {themeLoading || loadingThemes ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "#D4AF37", borderTopColor: "transparent" }} />
        </div>
      ) : (
        <>
          {/* Default Themes Section */}
          <div className="mb-8">
            <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Default Themes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {defaultThemesOnly.map(t => {
                const active = theme?.id === t.id;
                return (
                  <ThemeCard
                    key={t.id}
                    theme={t}
                    active={active}
                    saving={saving}
                    onSelect={() => handleSelectTheme(t.id)}
                  />
                );
              })}
            </div>
          </div>

          {/* Custom Themes Section */}
          {customThemesOnly.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Custom Themes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {customThemesOnly.map(t => {
                  const active = theme?.id === t.id;
                  return (
                    <ThemeCard
                      key={t.id}
                      theme={t}
                      active={active}
                      saving={saving}
                      onSelect={() => handleSelectTheme(t.id)}
                      onEdit={() => handleEditTheme(t)}
                      onDelete={() => handleDeleteTheme(t.id)}
                      deleting={deletingId === t.id}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Note */}
      <p className="mt-8 text-xs text-gray-400 font-sans max-w-md">
        Default themes (Gold & Black, Medical Blue) cannot be edited or deleted. 
        Create custom themes to match your brand colors.
      </p>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <ThemeModal
          theme={editingTheme}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTheme(null);
          }}
          onSave={handleSaveTheme}
        />
      )}
    </div>
  );
}

// ─── Theme Card Component ─────────────────────────────────────────────────────
interface ThemeCardProps {
  theme: CustomTheme;
  active: boolean;
  saving: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
}

function ThemeCard({ theme, active, saving, onSelect, onEdit, onDelete, deleting }: ThemeCardProps) {
  return (
    <div className="relative">
      <button
        onClick={onSelect}
        disabled={saving || deleting}
        className="w-full text-left rounded-sm border-2 overflow-hidden transition-all duration-200 hover:shadow-lg disabled:opacity-60"
        style={{
          borderColor: active ? theme.primary : "#E5E5E5",
          boxShadow: active ? `0 0 0 3px ${theme.primary}33` : undefined,
        }}
      >
        {/* Colour preview strip */}
        <div className="h-20 relative flex items-center justify-center gap-3 px-6"
          style={{ background: theme.bgNav }}>
          {/* Primary swatch */}
          <div className="w-10 h-10 rounded-full border-2 border-white/30 shadow-lg"
            style={{ background: theme.primary }} />
          {/* Light swatch */}
          <div className="w-6 h-6 rounded-full border-2 border-white/20"
            style={{ background: theme.primaryLight }} />
          {/* Page bg / gradient swatch */}
          <div className="w-6 h-6 rounded-full border-2 border-white/20"
            style={{ background: theme.bgGradient || theme.bgPage }} />

          {/* Active checkmark */}
          {active && (
            <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: theme.primary }}>
              <Check className="w-3.5 h-3.5" style={{ color: theme.primaryText }} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-sm text-gray-900 font-sans">{theme.name}</p>
              <p className="text-xs text-gray-400 font-sans mt-0.5">
                Primary: <span className="font-mono">{theme.primary}</span>
              </p>
            </div>
            {active && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                style={{ background: theme.primary }}>
                Active
              </span>
            )}
          </div>

          {/* Sample button preview */}
          <div className="flex gap-2">
            <div className="h-7 px-3 rounded-sm flex items-center text-[11px] font-bold"
              style={{ background: theme.primary, color: theme.primaryText }}>
              Button
            </div>
            <div className="h-7 px-3 rounded-sm flex items-center text-[11px] font-semibold border"
              style={{ borderColor: theme.borderColor, color: theme.textBody }}>
              Outline
            </div>
          </div>
        </div>
      </button>

      {/* Action buttons for custom themes */}
      {!theme.isDefault && onEdit && onDelete && (
        <div className="absolute top-2 left-2 flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            disabled={deleting}
            className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 flex items-center justify-center hover:bg-white transition-colors shadow-sm"
            title="Edit theme"
          >
            <Edit2 className="w-3.5 h-3.5 text-gray-700" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            disabled={deleting}
            className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm"
            title="Delete theme"
          >
            {deleting ? (
              <div className="w-3 h-3 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Theme Modal Component ────────────────────────────────────────────────────
interface ThemeModalProps {
  theme: CustomTheme | null;
  onClose: () => void;
  onSave: (theme: Partial<CustomTheme>) => Promise<void>;
}

function ThemeModal({ theme, onClose, onSave }: ThemeModalProps) {
  const [formData, setFormData] = useState<Partial<CustomTheme>>(
    theme || {
      name: "",
      primary: "#D4AF37",
      primaryLight: "#ffe87c",
      primaryDark: "#b8952e",
      primaryText: "#000000",
      bgPage: "#F9F9F9",
      bgGradient: "linear-gradient(135deg, #fdf9ee 0%, #f9f9f9 50%, #f5f2e8 100%)",
      bgCard: "#ffffff",
      bgNav: "#000000",
      textHeading: "#1A1A1A",
      textBody: "#374151",
      textMuted: "#6B6B6B",
      borderColor: "#E8E4DC",
      shadow: "0 2px 12px rgba(0,0,0,0.08)",
      shadowHover: "0 8px 28px rgba(0,0,0,0.15)",
    }
  );
  const [saving, setSaving] = useState(false);

  function updateField(key: keyof CustomTheme, value: string) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error("Theme name is required");
      return;
    }
    
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-heading text-gray-900">
            {theme ? "Edit Theme" : "Create Custom Theme"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Theme Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Theme Name *
            </label>
            <input
              type="text"
              value={formData.name || ""}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
              placeholder="e.g., Purple Elegance"
              required
            />
          </div>

          {/* Color Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: "primary", label: "Primary" },
              { key: "primaryLight", label: "Primary Light" },
              { key: "primaryDark", label: "Primary Dark" },
              { key: "primaryText", label: "Primary Text" },
              { key: "bgPage", label: "Page Background" },
              { key: "bgCard", label: "Card Background" },
              { key: "bgNav", label: "Nav Background" },
              { key: "textHeading", label: "Heading Text" },
              { key: "textBody", label: "Body Text" },
              { key: "textMuted", label: "Muted Text" },
              { key: "borderColor", label: "Border Color" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  {label}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData[key as keyof CustomTheme] as string || "#000000"}
                    onChange={(e) => updateField(key as keyof CustomTheme, e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData[key as keyof CustomTheme] as string || ""}
                    onChange={(e) => updateField(key as keyof CustomTheme, e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded font-mono"
                    placeholder="#000000"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Shadow inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Shadow (CSS)
              </label>
              <input
                type="text"
                value={formData.shadow || ""}
                onChange={(e) => updateField("shadow", e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded font-mono"
                placeholder="0 2px 12px rgba(0,0,0,0.08)"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Shadow Hover (CSS)
              </label>
              <input
                type="text"
                value={formData.shadowHover || ""}
                onChange={(e) => updateField("shadowHover", e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded font-mono"
                placeholder="0 8px 28px rgba(0,0,0,0.15)"
              />
            </div>
          </div>

          {/* Background Gradient */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Page Background Gradient
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Paste a CSS gradient value. This overlays the page background color. Leave blank for solid color.
            </p>
            <textarea
              value={formData.bgGradient || ""}
              onChange={(e) => updateField("bgGradient", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded font-mono focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent resize-none"
              placeholder="linear-gradient(135deg, #e0f4fb 0%, #f0faff 40%, #e8f5f0 100%)"
            />
            {/* Gradient preview */}
            {formData.bgGradient && (
              <div className="mt-2 h-10 w-full rounded border border-gray-200"
                style={{ background: formData.bgGradient }} />
            )}
            {/* Quick presets */}
            <div className="mt-2 flex flex-wrap gap-2">
              <p className="text-[10px] text-gray-400 w-full">Quick presets:</p>
              {[
                { label: "Sky Blue", value: "linear-gradient(135deg, #e0f4fb 0%, #f0faff 40%, #e8f5f0 100%)" },
                { label: "Warm Gold", value: "linear-gradient(135deg, #fdf9ee 0%, #f9f9f9 50%, #f5f2e8 100%)" },
                { label: "Soft Rose", value: "linear-gradient(135deg, #fdf2f8 0%, #fafafa 50%, #f5f0f5 100%)" },
                { label: "Mint Fresh", value: "linear-gradient(135deg, #f0fdf4 0%, #fafafa 50%, #ecfdf5 100%)" },
                { label: "Lavender", value: "linear-gradient(135deg, #f5f3ff 0%, #fafafa 50%, #ede9fe 100%)" },
                { label: "None", value: "" },
              ].map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => updateField("bgGradient", preset.value)}
                  className="px-2 py-1 text-[10px] rounded border border-gray-200 hover:border-[#D4AF37] transition-colors flex items-center gap-1.5"
                >
                  {preset.value && (
                    <span className="w-3 h-3 rounded-sm inline-block flex-shrink-0"
                      style={{ background: preset.value }} />
                  )}
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Preview</h3>
            <div className="space-y-3">
              {/* Nav preview */}
              <div className="h-12 rounded-sm flex items-center px-4 gap-3"
                style={{ background: formData.bgNav }}>
                <div className="w-8 h-8 rounded-full" style={{ background: formData.primary }} />
                <span className="text-sm font-semibold" style={{ color: formData.bgCard }}>
                  Navigation Bar
                </span>
              </div>
              {/* Content preview */}
              <div className="p-4 rounded-sm border" style={{ 
                background: formData.bgGradient || formData.bgPage,
                borderColor: formData.borderColor 
              }}>
                <div className="p-4 rounded-sm mb-3" style={{ background: formData.bgCard }}>
                  <h4 className="text-lg font-bold mb-2" style={{ color: formData.textHeading }}>
                    Heading Text
                  </h4>
                  <p className="text-sm mb-3" style={{ color: formData.textBody }}>
                    This is body text. It should be readable and comfortable.
                  </p>
                  <p className="text-xs mb-3" style={{ color: formData.textMuted }}>
                    This is muted text for secondary information.
                  </p>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 rounded-sm text-sm font-bold"
                      style={{ 
                        background: formData.primary,
                        color: formData.primaryText 
                      }}>
                      Primary Button
                    </button>
                    <button className="px-4 py-2 rounded-sm text-sm font-semibold border"
                      style={{ 
                        borderColor: formData.borderColor,
                        color: formData.textBody 
                      }}>
                      Secondary
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-bold text-black bg-[#D4AF37] rounded-sm hover:bg-[#b8952e] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  Saving...
                </>
              ) : (
                theme ? "Update Theme" : "Create Theme"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
