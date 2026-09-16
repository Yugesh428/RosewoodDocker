// ─── Theme Definitions ────────────────────────────────────────────────────────

export type ThemeKey = "gold" | "medical";

export interface Theme {
  key: ThemeKey;
  label: string;
  // Core palette
  primary:        string; // main accent colour
  primaryLight:   string; // lighter tint
  primaryDark:    string; // darker shade
  primaryText:    string; // text colour on primary bg
  // Backgrounds
  bgPage:         string; // page background
  bgCard:         string; // card background
  bgNav:          string; // navbar background
  // Text
  textHeading:    string;
  textBody:       string;
  textMuted:      string;
  // Borders
  borderColor:    string;
  // Shadows
  shadow:         string;
  shadowHover:    string;
}

export const themes: Record<ThemeKey, Theme> = {
  gold: {
    key:          "gold",
    label:        "Gold & Black",
    primary:      "#D4AF37",
    primaryLight: "#ffe87c",
    primaryDark:  "#b8952e",
    primaryText:  "#000000",
    bgPage:       "#F9F9F9",
    bgCard:       "#ffffff",
    bgNav:        "#000000",
    textHeading:  "#1A1A1A",
    textBody:     "#374151",
    textMuted:    "#6B6B6B",
    borderColor:  "#E8E4DC",
    shadow:       "0 2px 12px rgba(0,0,0,0.08)",
    shadowHover:  "0 8px 28px rgba(0,0,0,0.15)",
  },
  medical: {
    key:          "medical",
    label:        "Medical Blue",
    primary:      "#00B4D8",
    primaryLight: "#90E0EF",
    primaryDark:  "#0096C7",
    primaryText:  "#ffffff",
    bgPage:       "#EAF6FB",
    bgCard:       "#ffffff",
    bgNav:        "#023E8A",
    textHeading:  "#023E8A",
    textBody:     "#1a4a6b",
    textMuted:    "#4a7a96",
    borderColor:  "#CAE9F5",
    shadow:       "0 2px 12px rgba(0,100,160,0.10)",
    shadowHover:  "0 8px 28px rgba(0,100,160,0.20)",
  },
};

export const DEFAULT_THEME: ThemeKey = "gold";
