/**
 * Fix custom_themes table - drop and recreate with STRING id type
 * Run: npx tsx --env-file=.env scripts/fix-custom-themes-table.ts
 */

import sequelize from "../src/lib/database/sequelize";

async function fixCustomThemesTable() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected.");

    // Drop the existing table if it exists
    await sequelize.query('DROP TABLE IF EXISTS "custom_themes" CASCADE;');
    console.log("✅ Dropped existing custom_themes table.");

    // Create the table with correct schema
    await sequelize.query(`
      CREATE TABLE "custom_themes" (
        "id" VARCHAR(100) PRIMARY KEY,
        "name" VARCHAR(100) NOT NULL UNIQUE,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "primary" VARCHAR(50) NOT NULL,
        "primaryLight" VARCHAR(50) NOT NULL,
        "primaryDark" VARCHAR(50) NOT NULL,
        "primaryText" VARCHAR(50) NOT NULL,
        "bgPage" VARCHAR(50) NOT NULL,
        "bgCard" VARCHAR(50) NOT NULL,
        "bgNav" VARCHAR(50) NOT NULL,
        "textHeading" VARCHAR(50) NOT NULL,
        "textBody" VARCHAR(50) NOT NULL,
        "textMuted" VARCHAR(50) NOT NULL,
        "borderColor" VARCHAR(50) NOT NULL,
        "shadow" VARCHAR(100) NOT NULL,
        "shadowHover" VARCHAR(100) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✅ Created custom_themes table with STRING id type.");

    // Insert default themes
    await sequelize.query(`
      INSERT INTO "custom_themes" (
        "id", "name", "isDefault", "primary", "primaryLight", "primaryDark", "primaryText",
        "bgPage", "bgCard", "bgNav", "textHeading", "textBody", "textMuted",
        "borderColor", "shadow", "shadowHover"
      ) VALUES
      (
        'gold', 'Gold & Black', true, '#D4AF37', '#ffe87c', '#b8952e', '#000000',
        '#F9F9F9', '#ffffff', '#000000', '#1A1A1A', '#374151', '#6B6B6B',
        '#E8E4DC', '0 2px 12px rgba(0,0,0,0.08)', '0 8px 28px rgba(0,0,0,0.15)'
      ),
      (
        'medical', 'Medical Blue', true, '#00B4D8', '#90E0EF', '#0096C7', '#ffffff',
        '#EAF6FB', '#ffffff', '#023E8A', '#023E8A', '#1a4a6b', '#4a7a96',
        '#CAE9F5', '0 2px 12px rgba(0,100,160,0.10)', '0 8px 28px rgba(0,100,160,0.20)'
      )
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log("✅ Inserted default themes (Gold & Medical Blue).");

    // Fix site_theme table - check if it exists and has correct schema
    const siteThemeExists = await sequelize.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'site_theme';`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (siteThemeExists.length > 0) {
      // Check if activeThemeId column exists
      const hasActiveThemeId = (siteThemeExists as any[]).some(col => col.column_name === 'activeThemeId');
      
      if (!hasActiveThemeId) {
        // Check if old column name exists
        const hasActiveTheme = (siteThemeExists as any[]).some(col => col.column_name === 'activeTheme');
        
        if (hasActiveTheme) {
          // Rename old column
          await sequelize.query(`ALTER TABLE "site_theme" RENAME COLUMN "activeTheme" TO "activeThemeId";`);
          console.log("✅ Renamed activeTheme to activeThemeId in site_theme table.");
        } else {
          // Add the column
          await sequelize.query(`ALTER TABLE "site_theme" ADD COLUMN "activeThemeId" VARCHAR(100) NOT NULL DEFAULT 'gold';`);
          console.log("✅ Added activeThemeId column to site_theme table.");
        }
      }
    } else {
      // Create the table
      await sequelize.query(`
        CREATE TABLE "site_theme" (
          "id" INTEGER PRIMARY KEY DEFAULT 1,
          "activeThemeId" VARCHAR(100) NOT NULL DEFAULT 'gold',
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log("✅ Created site_theme table.");
    }
    
    await sequelize.query(`
      INSERT INTO "site_theme" ("id", "activeThemeId", "updatedAt")
      VALUES (1, 'gold', NOW())
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log("✅ site_theme singleton row ensured.");

    console.log("\n🎉 Custom themes table fixed successfully!");
  } catch (error) {
    console.error("❌ Fix failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

fixCustomThemesTable();
