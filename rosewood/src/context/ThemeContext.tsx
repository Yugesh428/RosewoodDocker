"use client";

import {
  createContext, useContext, useState, useEffect, useCallback, ReactNode,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ThemeData {
  id:            string;
  name:          string;
  isDefault:     boolean;
  primary:       string;
  primaryLight:  string;
  primaryDark:   string;
  primaryText:   string;
  bgPage:        string;
  bgGradient:    string;
  bgCard:        string;
  bgNav:         string;
  textHeading:   string;
  textBody:      string;
  textMuted:     string;
  borderColor:   string;
  shadow:        string;
  shadowHover:   string;
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  theme:        ThemeData | null;
  homeBg:       "blue" | "white" | "soft-blue" | "near-blue" | "creamy-blue";
  loading:      boolean;
  setTheme:     (themeId: string) => Promise<void>;
  setHomeBg:    (bg: "blue" | "white" | "soft-blue" | "near-blue" | "creamy-blue") => Promise<void>;
  refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme:        null,
  homeBg:       "blue",
  loading:      true,
  setTheme:     async () => {},
  setHomeBg:    async () => {},
  refreshTheme: async () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

// ─── Apply CSS variables helper ───────────────────────────────────────────────

function applyTheme(t: ThemeData) {
  const root = document.documentElement;
  root.style.setProperty("--color-primary",       t.primary);
  root.style.setProperty("--color-primary-light",  t.primaryLight);
  root.style.setProperty("--color-primary-dark",   t.primaryDark);
  root.style.setProperty("--color-primary-text",   t.primaryText);
  root.style.setProperty("--color-bg-page",        t.bgPage);
  root.style.setProperty("--color-bg-gradient",    t.bgGradient || "none");
  root.style.setProperty("--color-bg-card",        t.bgCard);
  root.style.setProperty("--color-bg-nav",         t.bgNav);
  root.style.setProperty("--color-text-heading",   t.textHeading);
  root.style.setProperty("--color-text-body",      t.textBody);
  root.style.setProperty("--color-text-muted",     t.textMuted);
  root.style.setProperty("--color-border",         t.borderColor);
  root.setAttribute("data-theme", t.id);

  // Apply gradient directly to html element so it shows through everything
  document.documentElement.style.backgroundColor = t.bgGradient ? "" : t.bgPage;
  document.documentElement.style.backgroundImage = t.bgGradient || "";
  if (!t.bgGradient) {
    document.documentElement.style.backgroundColor = t.bgPage;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme,   setThemeData] = useState<ThemeData | null>(null);
  const [homeBg,  setHomeBgState] = useState<"blue" | "white" | "soft-blue" | "near-blue" | "creamy-blue">("blue");
  const [loading, setLoading]   = useState(true);

  const refreshTheme = useCallback(async () => {
    try {
      const res = await fetch("/api/site-theme");
      const json = await res.json();
      if (json.success && json.data?.activeTheme) {
        setThemeData(json.data.activeTheme);
        applyTheme(json.data.activeTheme);
      }
      if (json.success && json.data?.homeBg) {
        setHomeBgState(json.data.homeBg as "blue" | "white" | "soft-blue" | "near-blue" | "creamy-blue");
      }
    } catch (err) {
      console.error("Failed to fetch theme:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshTheme(); }, [refreshTheme]);

  const setTheme = useCallback(async (themeId: string) => {
    const res = await fetch("/api/site-theme", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ activeThemeId: themeId }),
    });
    const json = await res.json();
    if (json.success) { await refreshTheme(); }
    else throw new Error(json.message || "Failed to set theme");
  }, [refreshTheme]);

  const setHomeBg = useCallback(async (bg: "blue" | "white" | "soft-blue" | "near-blue" | "creamy-blue") => {
    const res = await fetch("/api/site-theme", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ homeBg: bg }),
    });
    const json = await res.json();
    if (json.success) { setHomeBgState(bg); }
    else throw new Error(json.message || "Failed to update home background");
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, homeBg, loading, setTheme, setHomeBg, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
