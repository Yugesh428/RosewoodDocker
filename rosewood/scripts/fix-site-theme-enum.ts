/**
 * Fix site_theme table - remove ENUM constraint and use VARCHAR
 * Run: npx tsx --env-file=.env scripts/fix-site-theme-enum.ts
 */

import sequelize from "../src/lib/database/sequelize";

async function fixSiteThemeEnum() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected.\n");

    // Get current value before making changes
    const currentTheme = await sequelize.query(
      'SELECT "activeThemeId" FROM site_theme WHERE id = 1;',
      { type: sequelize.QueryTypes.SELECT }
    );
    const currentThemeId = (currentTheme[0] as any)?.activeThemeId || 'gold';
    console.log(`Current active theme: ${currentThemeId}`);

    // Drop and recreate the site_theme table
    console.log("\n➕ Dropping and recreating site_theme table...");
    await sequelize.query('DROP TABLE IF EXISTS "site_theme" CASCADE;');
    
    await sequelize.query(`
      CREATE TABLE "site_theme" (
        "id" INTEGER PRIMARY KEY DEFAULT 1,
        "activeThemeId" VARCHAR(100) NOT NULL DEFAULT 'gold',
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✅ Recreated site_theme table with VARCHAR type.");

    // Restore the active theme value
    await sequelize.query(`
      INSERT INTO "site_theme" ("id", "activeThemeId", "updatedAt")
      VALUES (1, :themeId, NOW());
    `, {
      replacements: { themeId: currentThemeId }
    });
    console.log(`✅ Restored active theme to: ${currentThemeId}`);

    // Try to drop the old ENUM type if it exists
    try {
      await sequelize.query('DROP TYPE IF EXISTS "enum_site_theme_activeTheme" CASCADE;');
      console.log("✅ Dropped old ENUM type.");
    } catch (err) {
      console.log("ℹ️  No old ENUM type to drop.");
    }

    // Verify the fix
    console.log("\n=== VERIFICATION ===");
    const result = await sequelize.query(
      'SELECT * FROM site_theme;',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.table(result);

    // Test setting a UUID theme
    console.log("\n=== TESTING UUID THEME ===");
    const uuidTheme = await sequelize.query(
      'SELECT id FROM custom_themes WHERE "isDefault" = false LIMIT 1;',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (uuidTheme.length > 0) {
      const testThemeId = (uuidTheme[0] as any).id;
      await sequelize.query(
        'UPDATE site_theme SET "activeThemeId" = :themeId, "updatedAt" = NOW() WHERE id = 1;',
        { replacements: { themeId: testThemeId } }
      );
      console.log(`✅ Successfully set theme to UUID: ${testThemeId}`);
      
      // Restore to original
      await sequelize.query(
        'UPDATE site_theme SET "activeThemeId" = :themeId, "updatedAt" = NOW() WHERE id = 1;',
        { replacements: { themeId: currentThemeId } }
      );
      console.log(`✅ Restored theme to: ${currentThemeId}`);
    }

    console.log("\n🎉 Fix completed successfully!");

  } catch (error) {
    console.error("❌ Fix failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

fixSiteThemeEnum();
