import { NextRequest, NextResponse } from "next/server";
import SiteTheme, { CustomTheme } from "./siteThemeModel";
import { AppError, errorResponse } from "@/lib/apiError";

// ─── GET /api/site-theme ──────────────────────────────────────────────────────
// Returns the currently active theme (full theme object) + homeBg setting
export async function getTheme(_req: NextRequest): Promise<NextResponse> {
  try {
    const [row] = await SiteTheme.findOrCreate({
      where:    { id: 1 },
      defaults: { activeThemeId: "gold", homeBg: "blue" },
    });

    console.log("[getTheme] Active theme ID from database:", row.activeThemeId);

    let activeTheme;
    const themeFromDb = await CustomTheme.findByPk(row.activeThemeId);
    
    if (themeFromDb) {
      activeTheme = themeFromDb.toJSON();
    } else {
      const defaultThemes = {
        gold: {
          id: "gold", name: "Gold & Black", isDefault: true,
          primary: "#D4AF37", primaryLight: "#ffe87c", primaryDark: "#b8952e", primaryText: "#000000",
          bgPage: "#f0f8ff", bgGradient: "linear-gradient(160deg, #dff0fb 0%, #eaf6ff 35%, #f4f9fc 65%, #edf5fb 100%)",
          bgCard: "#ffffff", bgNav: "#000000", textHeading: "#1A1A1A", textBody: "#374151", textMuted: "#6B6B6B",
          borderColor: "#E8E4DC", shadow: "0 2px 12px rgba(0,0,0,0.08)", shadowHover: "0 8px 28px rgba(0,0,0,0.15)",
        },
        medical: {
          id: "medical", name: "Medical Blue", isDefault: true,
          primary: "#00B4D8", primaryLight: "#90E0EF", primaryDark: "#0096C7", primaryText: "#ffffff",
          bgPage: "#EAF6FB", bgGradient: "linear-gradient(135deg, #e0f4fb 0%, #f0faff 40%, #e8f5f0 100%)",
          bgCard: "#ffffff", bgNav: "#023E8A", textHeading: "#023E8A", textBody: "#1a4a6b", textMuted: "#4a7a96",
          borderColor: "#CAE9F5", shadow: "0 2px 12px rgba(0,100,160,0.10)", shadowHover: "0 8px 28px rgba(0,100,160,0.20)",
        },
      };
      if (row.activeThemeId === "gold" || row.activeThemeId === "medical") {
        activeTheme = defaultThemes[row.activeThemeId as "gold" | "medical"];
      } else {
        await row.update({ activeThemeId: "gold" });
        activeTheme = defaultThemes.gold;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        activeTheme,
        homeBg: row.homeBg ?? "blue",
      },
    });
  } catch (err) {
    console.error("[getTheme] Error:", err);
    return errorResponse(err);
  }
}

// ─── PUT /api/site-theme ──────────────────────────────────────────────────────
// Body: { activeThemeId?: string, homeBg?: "blue" | "white" }
export async function updateTheme(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { activeThemeId, homeBg } = body;

    const [row] = await SiteTheme.findOrCreate({
      where:    { id: 1 },
      defaults: { activeThemeId: "gold", homeBg: "blue" },
    });

    const updates: Partial<{ activeThemeId: string; homeBg: string; updatedAt: Date }> = {
      updatedAt: new Date(),
    };

    if (activeThemeId) {
      const themeExists = await CustomTheme.findByPk(activeThemeId);
      if (!themeExists) throw new AppError("Theme not found", 404, "NOT_FOUND");
      updates.activeThemeId = activeThemeId;
    }

    if (homeBg) {
      if (homeBg !== "blue" && homeBg !== "white" && homeBg !== "soft-blue" && homeBg !== "near-blue" && homeBg !== "creamy-blue") {
        throw new AppError("homeBg must be 'blue', 'near-blue', 'creamy-blue', 'soft-blue', or 'white'", 400, "VALIDATION_ERROR");
      }
      updates.homeBg = homeBg;
    }

    await row.update(updates);

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      data: { activeThemeId: row.activeThemeId, homeBg: row.homeBg },
    });
  } catch (err) {
    console.error("[updateTheme] Error:", err);
    return errorResponse(err);
  }
}
