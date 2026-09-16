/**
 * docker/seed-admin.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * One-shot seed script run inside the Docker "seed" service.
 * Creates the ADMIN user + default themes if they don't exist yet.
 *
 * Credentials are read from environment variables so they never need to be
 * hard-coded here.  Set them in docker-compose.yml → environment OR in .env:
 *
 *   SEED_ADMIN_NAME      = "Rosewood Admin"
 *   SEED_ADMIN_EMAIL     = "admin@rosewood.com"
 *   SEED_ADMIN_PASSWORD  = "Admin@1234"
 *
 * Run manually (outside Docker):
 *   npx tsx --env-file=.env --tsconfig tsconfig.scripts.json docker/seed-admin.ts
 * ─────────────────────────────────────────────────────────────────────────────
 */

import bcrypt from "bcryptjs";
import sequelize from "../src/lib/database/sequelize";
import User from "../src/lib/models/userModel";
import { CustomTheme, default as SiteTheme } from "../src/features/siteTheme/siteThemeModel";

// ── Read credentials from env ─────────────────────────────────────────────────

const ADMIN_NAME     = process.env.SEED_ADMIN_NAME     || "Rosewood Admin";
const ADMIN_EMAIL    = process.env.SEED_ADMIN_EMAIL    || "admin@rosewood.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@1234";

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(msg: string)  { console.log(`[seed] ✅  ${msg}`); }
function skip(msg: string) { console.log(`[seed] ℹ️   ${msg}`); }
function warn(msg: string) { console.warn(`[seed] ⚠️   ${msg}`); }

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Connect
  await sequelize.authenticate();
  log("Database connected.");

  // 2. Sync tables (non-destructive — creates if missing)
  await sequelize.sync({ force: false, alter: false });
  log("Tables synced.");

  // ── Admin user ─────────────────────────────────────────────────────────────
  const existing = await User.findOne({ where: { email: ADMIN_EMAIL } });

  if (existing) {
    skip(`Admin user already exists: ${ADMIN_EMAIL}`);
  } else {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await User.create({
      name:     ADMIN_NAME,
      email:    ADMIN_EMAIL,
      password: hashed,
      role:     "ADMIN",
      isActive: true,
    });
    log(`Admin created → email: ${ADMIN_EMAIL}  password: ${ADMIN_PASSWORD}`);
    warn("Change this password after first login.");
  }

  // ── Default themes ─────────────────────────────────────────────────────────

  const [, goldCreated] = await CustomTheme.findOrCreate({
    where: { id: "gold" },
    defaults: {
      id:           "gold",
      name:         "Gold & Black",
      isDefault:    true,
      primary:      "#D4AF37",
      primaryLight: "#ffe87c",
      primaryDark:  "#b8952e",
      primaryText:  "#000000",
      bgPage:       "#F9F9F9",
      bgGradient:   "linear-gradient(135deg, #fdf9ee 0%, #f9f9f9 50%, #f5f2e8 100%)",
      bgCard:       "#ffffff",
      bgNav:        "#000000",
      textHeading:  "#1A1A1A",
      textBody:     "#374151",
      textMuted:    "#6B6B6B",
      borderColor:  "#E8E4DC",
      shadow:       "0 2px 12px rgba(0,0,0,0.08)",
      shadowHover:  "0 8px 28px rgba(0,0,0,0.15)",
    } as Record<string, unknown>,
  });
  goldCreated ? log("Gold theme created.") : skip("Gold theme already exists.");

  const [, medCreated] = await CustomTheme.findOrCreate({
    where: { id: "medical" },
    defaults: {
      id:           "medical",
      name:         "Medical Blue",
      isDefault:    true,
      primary:      "#00B4D8",
      primaryLight: "#90E0EF",
      primaryDark:  "#0096C7",
      primaryText:  "#ffffff",
      bgPage:       "#EAF6FB",
      bgGradient:   "linear-gradient(135deg, #e0f4fb 0%, #f0faff 40%, #e8f5f0 100%)",
      bgCard:       "#ffffff",
      bgNav:        "#023E8A",
      textHeading:  "#023E8A",
      textBody:     "#1a4a6b",
      textMuted:    "#4a7a96",
      borderColor:  "#CAE9F5",
      shadow:       "0 2px 12px rgba(0,100,160,0.10)",
      shadowHover:  "0 8px 28px rgba(0,100,160,0.20)",
    } as Record<string, unknown>,
  });
  medCreated ? log("Medical Blue theme created.") : skip("Medical Blue theme already exists.");

  // ── Active site-theme row ──────────────────────────────────────────────────
  const [, siteCreated] = await SiteTheme.findOrCreate({
    where:    { id: 1 },
    defaults: { activeThemeId: "gold", homeBg: "blue" },
  });
  siteCreated ? log("Site-theme row created (default: Gold).") : skip("Site-theme row already exists.");

  console.log("\n[seed] 🎉  Seed complete.\n");
  console.log("  Admin login:");
  console.log(`    Email    : ${ADMIN_EMAIL}`);
  console.log(`    Password : ${ADMIN_PASSWORD}`);
  console.log("  URL: http://localhost:3000/admin/login\n");
}

main()
  .catch(err => { console.error("[seed] ❌ Failed:", err); process.exit(1); })
  .finally(() => sequelize.close());
