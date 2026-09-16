/**
 * Check theme system status
 * Run: npx tsx --env-file=.env scripts/check-themes.ts
 */

import sequelize from "../src/lib/database/sequelize";

async function checkThemes() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected.\n");

    // Check custom_themes table
    console.log("=== CUSTOM THEMES ===");
    const themes = await sequelize.query(
      'SELECT id, name, "isDefault" FROM custom_themes ORDER BY "isDefault" DESC, name;',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.table(themes);

    // Check site_theme table
    console.log("\n=== ACTIVE THEME ===");
    const activeTheme = await sequelize.query(
      'SELECT * FROM site_theme;',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.table(activeTheme);

  } catch (error) {
    console.error("❌ Check failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

checkThemes();
