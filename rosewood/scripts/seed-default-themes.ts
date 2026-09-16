/**
 * Seed default themes (Gold & Medical Blue) into the custom_themes table
 * Run: npx ts-node scripts/seed-default-themes.ts
 */

import { CustomTheme } from "../src/features/siteTheme/siteThemeModel";
import sequelize from "../src/lib/database/sequelize";

async function seedDefaultThemes() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected.");

    // Sync the CustomTheme table
    await CustomTheme.sync({ force: false, alter: false });

    // Seed Gold theme
    const [goldTheme, goldCreated] = await CustomTheme.findOrCreate({
      where: { id: "gold" },
      defaults: {
        id: "gold",
        name: "Gold & Black",
        isDefault: true,
        primary: "#D4AF37",
        primaryLight: "#ffe87c",
        primaryDark: "#b8952e",
        primaryText: "#000000",
        bgPage: "#F9F9F9",
        bgCard: "#ffffff",
        bgNav: "#000000",
        textHeading: "#1A1A1A",
        textBody: "#374151",
        textMuted: "#6B6B6B",
        borderColor: "#E8E4DC",
        shadow: "0 2px 12px rgba(0,0,0,0.08)",
        shadowHover: "0 8px 28px rgba(0,0,0,0.15)",
      },
    });
    console.log(goldCreated ? "✅ Gold theme created." : "ℹ️  Gold theme already exists.");

    // Seed Medical Blue theme
    const [medicalTheme, medicalCreated] = await CustomTheme.findOrCreate({
      where: { id: "medical" },
      defaults: {
        id: "medical",
        name: "Medical Blue",
        isDefault: true,
        primary: "#00B4D8",
        primaryLight: "#90E0EF",
        primaryDark: "#0096C7",
        primaryText: "#ffffff",
        bgPage: "#EAF6FB",
        bgCard: "#ffffff",
        bgNav: "#023E8A",
        textHeading: "#023E8A",
        textBody: "#1a4a6b",
        textMuted: "#4a7a96",
        borderColor: "#CAE9F5",
        shadow: "0 2px 12px rgba(0,100,160,0.10)",
        shadowHover: "0 8px 28px rgba(0,100,160,0.20)",
      },
    });
    console.log(medicalCreated ? "✅ Medical Blue theme created." : "ℹ️  Medical Blue theme already exists.");

    console.log("\n🎉 Default themes seeded successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seedDefaultThemes();
