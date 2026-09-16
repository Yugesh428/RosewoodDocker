import { NextRequest, NextResponse } from "next/server";
import { CustomTheme } from "./siteThemeModel";
import { AppError, errorResponse } from "@/lib/apiError";
import { logger } from "@/lib/logger";

// ─── GET /api/custom-themes ───────────────────────────────────────────────────
// Fetch all custom themes (including defaults)
export async function getAllCustomThemes(_req: NextRequest): Promise<NextResponse> {
  try {
    const themes = await CustomTheme.findAll({
      order: [["isDefault", "DESC"], ["name", "ASC"]],
    });
    return NextResponse.json({ success: true, data: themes });
  } catch (err) {
    logger.error("[customThemeController.getAllCustomThemes]", err);
    return errorResponse(err);
  }
}

// ─── POST /api/custom-themes ──────────────────────────────────────────────────
// Create a new custom theme
export async function createCustomTheme(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const {
      name,
      primary,
      primaryLight,
      primaryDark,
      primaryText,
      bgPage,
      bgGradient,
      bgCard,
      bgNav,
      textHeading,
      textBody,
      textMuted,
      borderColor,
      shadow,
      shadowHover,
    } = body;

    // Validate required fields
    if (!name?.trim()) {
      throw new AppError("Theme name is required", 400, "VALIDATION_ERROR");
    }

    // Check if name already exists
    const existing = await CustomTheme.findOne({ where: { name: name.trim() } });
    if (existing) {
      throw new AppError("A theme with this name already exists", 400, "DUPLICATE_NAME");
    }

    // Create theme
    const theme = await CustomTheme.create({
      name: name.trim(),
      isDefault: false,
      primary: primary || "#D4AF37",
      primaryLight: primaryLight || "#ffe87c",
      primaryDark: primaryDark || "#b8952e",
      primaryText: primaryText || "#000000",
      bgPage: bgPage || "#F9F9F9",
      bgGradient: bgGradient || null,
      bgCard: bgCard || "#ffffff",
      bgNav: bgNav || "#000000",
      textHeading: textHeading || "#1A1A1A",
      textBody: textBody || "#374151",
      textMuted: textMuted || "#6B6B6B",
      borderColor: borderColor || "#E8E4DC",
      shadow: shadow || "0 2px 12px rgba(0,0,0,0.08)",
      shadowHover: shadowHover || "0 8px 28px rgba(0,0,0,0.15)",
    });

    logger.info(`[customThemeController.createCustomTheme] Created theme: ${theme.name}`);
    return NextResponse.json({
      success: true,
      message: "Custom theme created successfully",
      data: theme,
    });
  } catch (err) {
    logger.error("[customThemeController.createCustomTheme]", err);
    return errorResponse(err);
  }
}

// ─── PUT /api/custom-themes/:id ───────────────────────────────────────────────
// Update an existing custom theme
export async function updateCustomTheme(req: NextRequest, id: string): Promise<NextResponse> {
  try {
    const theme = await CustomTheme.findByPk(id);
    if (!theme) {
      throw new AppError("Theme not found", 404, "NOT_FOUND");
    }

    // Prevent editing default themes
    if (theme.isDefault) {
      throw new AppError("Default themes cannot be modified", 403, "FORBIDDEN");
    }

    const body = await req.json();
    await theme.update(body);

    logger.info(`[customThemeController.updateCustomTheme] Updated theme: ${theme.name}`);
    return NextResponse.json({
      success: true,
      message: "Theme updated successfully",
      data: theme,
    });
  } catch (err) {
    logger.error("[customThemeController.updateCustomTheme]", err);
    return errorResponse(err);
  }
}

// ─── DELETE /api/custom-themes/:id ────────────────────────────────────────────
// Delete a custom theme
export async function deleteCustomTheme(_req: NextRequest, id: string): Promise<NextResponse> {
  try {
    const theme = await CustomTheme.findByPk(id);
    if (!theme) {
      throw new AppError("Theme not found", 404, "NOT_FOUND");
    }

    // Prevent deleting default themes
    if (theme.isDefault) {
      throw new AppError("Default themes cannot be deleted", 403, "FORBIDDEN");
    }

    await theme.destroy();

    logger.info(`[customThemeController.deleteCustomTheme] Deleted theme: ${theme.name}`);
    return NextResponse.json({
      success: true,
      message: "Theme deleted successfully",
    });
  } catch (err) {
    logger.error("[customThemeController.deleteCustomTheme]", err);
    return errorResponse(err);
  }
}
