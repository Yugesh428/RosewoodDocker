/**
 * Migration script — run once to apply schema changes safely.
 * Run: npm run db:migrate
 */

import sequelize from "./sequelize";
import User from "../models/userModel";
import Category from "../../features/productCategory/productCatetgoryModel";
import Product from "../../features/products/productModel";
import ProductIngredient from "../../features/products/productIngredientModel";
import Inventory from "../../features/inventory/inventoryModel";
import Order from "../../features/orders/orderModel";
import OrderItem from "../../features/orderItems/orderItemModel";
import Staff from "../../features/staff/staffModel";
import Wishlist from "../../features/wishlist/wishlistModel";
import Review from "../../features/reviews/reviewModel";
import Feedback from "../../features/feedback/feedbackModel";
import GuestCart from "../../features/guestCart/guestCartModel";

// ── UI models ─────────────────────────────────────────────────────────────────
import HeroSection from "../../features/Ui/HeroSection/heroModel/heroModel";
import OurProductCollectionCategory from "../../features/Ui/ourProductCollection/ourProductCollectionCategoryModel";
import OurProduct from "../../features/Ui/ourProductCollection/ourProductContent/ourProductModel";
import Testimonial from "../../features/Ui/testimonials/testimonialsModel";
import AboutUsTitle from "../../features/Ui/AboutUsPage/AboutUs Head/aboutUsTitleModel";
import OurStory from "../../features/Ui/AboutUsPage/ourStory/ourStroyModel";
import Mission from "../../features/Ui/AboutUsPage/ourMisson/missionModel";
import OurValues from "../../features/Ui/AboutUsPage/ourValues/ourValuesModel";
import ContactInfo from "../../features/Ui/contact/contactInfo/contactInfoModel";
import ContactForm from "../../features/Ui/contact/contactForm/contactFormModel";
import SiteTheme from "../../features/siteTheme/siteThemeModel";

async function migrate() {
  const q = sequelize.getQueryInterface();

  try {
    await sequelize.authenticate();
    console.log("✅ DB connected.");

    // ── 1. categories — add parentId if missing ───────────────────────────────
    const categoryColumns = await q.describeTable("categories");
    if (!categoryColumns["parentId"]) {
      console.log("➕ Adding parentId to categories...");
      await sequelize.query(`ALTER TABLE "categories" ADD COLUMN "parentId" UUID DEFAULT NULL;`);
      await sequelize.query(`
        ALTER TABLE "categories"
        ADD CONSTRAINT "categories_parentId_fkey"
        FOREIGN KEY ("parentId") REFERENCES "categories" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      console.log("✅ categories.parentId added.");
    } else {
      console.log("ℹ️  categories.parentId already exists.");
    }

    // ── 2. users — add isActive if missing ────────────────────────────────────
    const userColumns = await q.describeTable("users");
    if (!userColumns["isActive"]) {
      console.log("➕ Adding isActive to users...");
      await sequelize.query(`ALTER TABLE "users" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT TRUE;`);
      console.log("✅ users.isActive added.");
    } else {
      console.log("ℹ️  users.isActive already exists.");
    }

    // ── 3. products — drop and recreate with correct camelCase columns ────────
    const productColumns = await q.describeTable("products").catch(() => null);

    if (!productColumns) {
      console.log("➕ products table not found — creating with explicit SQL...");
      
      // Create products first
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "products" (
          "id"                  UUID          NOT NULL DEFAULT gen_random_uuid(),
          "categoryId"          UUID          NOT NULL REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
          "productName"         VARCHAR(200)  NOT NULL,
          "productImage"        VARCHAR(1000) DEFAULT NULL,
          "dosageForm"          VARCHAR(100)  NOT NULL,
          "strength"            VARCHAR(50)   NOT NULL,
          "packSize"            VARCHAR(50)   NOT NULL,
          "unitType"            VARCHAR(50)   NOT NULL,
          "sellingPrice"        DECIMAL(10,2) NOT NULL,
          "originalPrice"       DECIMAL(10,2) NOT NULL,
          "tax"                 DECIMAL(5,2)  NOT NULL DEFAULT 0,
          "discount"            DECIMAL(5,2)  NOT NULL DEFAULT 0,
          "productDescriptions" JSONB         NOT NULL DEFAULT '[]',
          "specifications"      JSONB         NOT NULL DEFAULT '[]',
          "suitableFor"         JSONB         NOT NULL DEFAULT '[]',
          "isActive"            BOOLEAN       NOT NULL DEFAULT TRUE,
          "createdAt"           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
          "updatedAt"           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
          PRIMARY KEY ("id")
        );
      `);
      console.log("✅ products table created.");

      // Then create product_ingredients (references products)
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "product_ingredients" (
          "id"             UUID         NOT NULL DEFAULT gen_random_uuid(),
          "productId"      UUID         NOT NULL REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          "ingredientName" VARCHAR(200) NOT NULL,
          "quantity"       VARCHAR(50)  DEFAULT NULL,
          "unit"           VARCHAR(50)  DEFAULT NULL,
          "sortOrder"      INTEGER      NOT NULL DEFAULT 0,
          "createdAt"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
          "updatedAt"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
          PRIMARY KEY ("id")
        );
      `);
      console.log("✅ product_ingredients table created.");
    } else if (!productColumns["categoryId"]) {
      // Table exists but was created with snake_case — drop and recreate
      console.log("🔄 products table has wrong column casing — dropping and recreating...");
      await sequelize.query(`DROP TABLE IF EXISTS "product_ingredients" CASCADE;`);
      await sequelize.query(`DROP TABLE IF EXISTS "products" CASCADE;`);
      console.log("✅ Old products + product_ingredients tables dropped.");

      // Create products first, then product_ingredients (FK dependency order)
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "products" (
          "id"                  UUID          NOT NULL DEFAULT gen_random_uuid(),
          "categoryId"          UUID          NOT NULL REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
          "productName"         VARCHAR(200)  NOT NULL,
          "productImage"        VARCHAR(1000) DEFAULT NULL,
          "dosageForm"          VARCHAR(100)  NOT NULL,
          "strength"            VARCHAR(50)   NOT NULL,
          "packSize"            VARCHAR(50)   NOT NULL,
          "unitType"            VARCHAR(50)   NOT NULL,
          "sellingPrice"        DECIMAL(10,2) NOT NULL,
          "originalPrice"       DECIMAL(10,2) NOT NULL,
          "tax"                 DECIMAL(5,2)  NOT NULL DEFAULT 0,
          "discount"            DECIMAL(5,2)  NOT NULL DEFAULT 0,
          "productDescriptions" JSONB         NOT NULL DEFAULT '[]',
          "specifications"      JSONB         NOT NULL DEFAULT '[]',
          "suitableFor"         JSONB         NOT NULL DEFAULT '[]',
          "isActive"            BOOLEAN       NOT NULL DEFAULT TRUE,
          "createdAt"           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
          "updatedAt"           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
          PRIMARY KEY ("id")
        );
      `);
      console.log("✅ products table created.");

      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "product_ingredients" (
          "id"             UUID         NOT NULL DEFAULT gen_random_uuid(),
          "productId"      UUID         NOT NULL REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          "ingredientName" VARCHAR(200) NOT NULL,
          "quantity"       VARCHAR(50)  DEFAULT NULL,
          "unit"           VARCHAR(50)  DEFAULT NULL,
          "sortOrder"      INTEGER      NOT NULL DEFAULT 0,
          "createdAt"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
          "updatedAt"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
          PRIMARY KEY ("id")
        );
      `);
      console.log("✅ product_ingredients table created.");
    } else {
      console.log("ℹ️  products table already correct.");

      // Still check for specifications and suitableFor in case they were missing
      if (!productColumns["specifications"]) {
        console.log("➕ Adding specifications to products...");
        await sequelize.query(`ALTER TABLE "products" ADD COLUMN "specifications" JSONB NOT NULL DEFAULT '[]';`);
        console.log("✅ products.specifications added.");
      }
      if (!productColumns["suitableFor"]) {
        console.log("➕ Adding suitableFor to products...");
        await sequelize.query(`ALTER TABLE "products" ADD COLUMN "suitableFor" JSONB NOT NULL DEFAULT '[]';`);
        console.log("✅ products.suitableFor added.");
      }
    }

    // ── 4. orders — ensure all columns exist (full schema check) ─────────────
    const orderColumns = await q.describeTable("orders").catch(() => null);
    if (orderColumns) {

      // customerId — may be missing if table was created with old schema
      if (!orderColumns["customerId"]) {
        console.log("➕ Adding customerId to orders...");
        await sequelize.query(`ALTER TABLE "orders" ADD COLUMN "customerId" UUID DEFAULT NULL;`);
        // Add FK constraint only if users table exists
        await sequelize.query(`
          ALTER TABLE "orders"
          ADD CONSTRAINT "orders_customerId_fkey"
          FOREIGN KEY ("customerId") REFERENCES "users" ("id")
          ON DELETE RESTRICT ON UPDATE CASCADE;
        `).catch(() => console.log("ℹ️  customerId FK already exists or skipped."));
        console.log("✅ orders.customerId added.");
      } else {
        // Make sure it's nullable for guest orders
        const customerIdCol = orderColumns["customerId"] as { allowNull?: boolean } | undefined;
        if (customerIdCol && customerIdCol.allowNull === false) {
          console.log("🔧 Making orders.customerId nullable for guest orders...");
          await sequelize.query(`ALTER TABLE "orders" ALTER COLUMN "customerId" DROP NOT NULL;`);
          console.log("✅ orders.customerId is now nullable.");
        } else {
          console.log("ℹ️  orders.customerId already nullable.");
        }
      }

      if (!orderColumns["isGuest"]) {
        console.log("➕ Adding isGuest to orders...");
        await sequelize.query(`ALTER TABLE "orders" ADD COLUMN "isGuest" BOOLEAN NOT NULL DEFAULT FALSE;`);
        console.log("✅ orders.isGuest added.");
      } else {
        console.log("ℹ️  orders.isGuest already exists.");
      }

      if (!orderColumns["guestName"]) {
        console.log("➕ Adding guestName to orders...");
        await sequelize.query(`ALTER TABLE "orders" ADD COLUMN "guestName" VARCHAR(255) DEFAULT NULL;`);
        console.log("✅ orders.guestName added.");
      } else {
        console.log("ℹ️  orders.guestName already exists.");
      }

      if (!orderColumns["guestEmail"]) {
        console.log("➕ Adding guestEmail to orders...");
        await sequelize.query(`ALTER TABLE "orders" ADD COLUMN "guestEmail" VARCHAR(255) DEFAULT NULL;`);
        console.log("✅ orders.guestEmail added.");
      } else {
        console.log("ℹ️  orders.guestEmail already exists.");
      }

      if (!orderColumns["guestPhone"]) {
        console.log("➕ Adding guestPhone to orders...");
        await sequelize.query(`ALTER TABLE "orders" ADD COLUMN "guestPhone" VARCHAR(20) DEFAULT NULL;`);
        console.log("✅ orders.guestPhone added.");
      } else {
        console.log("ℹ️  orders.guestPhone already exists.");
      }

      // Other columns that may be missing in older schemas
      if (!orderColumns["subtotal"]) {
        console.log("➕ Adding subtotal to orders...");
        await sequelize.query(`ALTER TABLE "orders" ADD COLUMN "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0;`);
        console.log("✅ orders.subtotal added.");
      }
      if (!orderColumns["taxAmount"]) {
        console.log("➕ Adding taxAmount to orders...");
        await sequelize.query(`ALTER TABLE "orders" ADD COLUMN "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;`);
        console.log("✅ orders.taxAmount added.");
      }
      if (!orderColumns["discountAmount"]) {
        console.log("➕ Adding discountAmount to orders...");
        await sequelize.query(`ALTER TABLE "orders" ADD COLUMN "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;`);
        console.log("✅ orders.discountAmount added.");
      }
      if (!orderColumns["totalAmount"]) {
        console.log("➕ Adding totalAmount to orders...");
        await sequelize.query(`ALTER TABLE "orders" ADD COLUMN "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;`);
        console.log("✅ orders.totalAmount added.");
      }
      if (!orderColumns["deliveryAddress"]) {
        console.log("➕ Adding deliveryAddress to orders...");
        await sequelize.query(`ALTER TABLE "orders" ADD COLUMN "deliveryAddress" TEXT NOT NULL DEFAULT '';`);
        console.log("✅ orders.deliveryAddress added.");
      }
      if (!orderColumns["deliveryNotes"]) {
        console.log("➕ Adding deliveryNotes to orders...");
        await sequelize.query(`ALTER TABLE "orders" ADD COLUMN "deliveryNotes" TEXT DEFAULT NULL;`);
        console.log("✅ orders.deliveryNotes added.");
      }
      if (!orderColumns["confirmedAt"]) {
        console.log("➕ Adding confirmedAt to orders...");
        await sequelize.query(`ALTER TABLE "orders" ADD COLUMN "confirmedAt" TIMESTAMPTZ DEFAULT NULL;`);
        console.log("✅ orders.confirmedAt added.");
      }
      if (!orderColumns["shippedAt"]) {
        console.log("➕ Adding shippedAt to orders...");
        await sequelize.query(`ALTER TABLE "orders" ADD COLUMN "shippedAt" TIMESTAMPTZ DEFAULT NULL;`);
        console.log("✅ orders.shippedAt added.");
      }
      if (!orderColumns["deliveredAt"]) {
        console.log("➕ Adding deliveredAt to orders...");
        await sequelize.query(`ALTER TABLE "orders" ADD COLUMN "deliveredAt" TIMESTAMPTZ DEFAULT NULL;`);
        console.log("✅ orders.deliveredAt added.");
      }
      if (!orderColumns["cancelledAt"]) {
        console.log("➕ Adding cancelledAt to orders...");
        await sequelize.query(`ALTER TABLE "orders" ADD COLUMN "cancelledAt" TIMESTAMPTZ DEFAULT NULL;`);
        console.log("✅ orders.cancelledAt added.");
      }
      if (!orderColumns["cancellationReason"]) {
        console.log("➕ Adding cancellationReason to orders...");
        await sequelize.query(`ALTER TABLE "orders" ADD COLUMN "cancellationReason" TEXT DEFAULT NULL;`);
        console.log("✅ orders.cancellationReason added.");
      }

      // Ensure ENUM types exist for orderStatus and paymentStatus
      if (!orderColumns["orderStatus"]) {
        console.log("➕ Adding orderStatus to orders...");
        await sequelize.query(`
          DO $$ BEGIN
            CREATE TYPE "enum_orders_orderStatus" AS ENUM('pending','confirmed','processing','shipped','delivered','cancelled');
          EXCEPTION WHEN duplicate_object THEN null; END $$;
        `);
        await sequelize.query(`ALTER TABLE "orders" ADD COLUMN "orderStatus" "enum_orders_orderStatus" NOT NULL DEFAULT 'pending';`);
        console.log("✅ orders.orderStatus added.");
      }
      if (!orderColumns["paymentStatus"]) {
        console.log("➕ Adding paymentStatus to orders...");
        await sequelize.query(`
          DO $$ BEGIN
            CREATE TYPE "enum_orders_paymentStatus" AS ENUM('unpaid','paid','refunded');
          EXCEPTION WHEN duplicate_object THEN null; END $$;
        `);
        await sequelize.query(`ALTER TABLE "orders" ADD COLUMN "paymentStatus" "enum_orders_paymentStatus" NOT NULL DEFAULT 'unpaid';`);
        console.log("✅ orders.paymentStatus added.");
      }
      if (!orderColumns["paymentMethod"]) {
        console.log("➕ Adding paymentMethod to orders...");
        await sequelize.query(`
          DO $$ BEGIN
            CREATE TYPE "enum_orders_paymentMethod" AS ENUM('cash','card','online','upi');
          EXCEPTION WHEN duplicate_object THEN null; END $$;
        `);
        await sequelize.query(`ALTER TABLE "orders" ADD COLUMN "paymentMethod" "enum_orders_paymentMethod" NOT NULL DEFAULT 'cash';`);
        console.log("✅ orders.paymentMethod added.");
      }

      console.log("✅ orders table schema verified.");
    } else {
      console.log("ℹ️  orders table not found — will be created by sync.");
    }

    // ── 5. Fix hero_slides table if it exists with old schema ─────────────────
    const heroColumns = await q.describeTable("hero_slides").catch(() => null);
    if (heroColumns) {
      console.log("✅ hero_slides table exists");
      
      // Check if title column exists
      if (!heroColumns["title"]) {
        console.log("➕ Adding title to hero_slides...");
        await sequelize.query(`ALTER TABLE "hero_slides" ADD COLUMN "title" VARCHAR(255) DEFAULT NULL;`);
        console.log("✅ hero_slides.title added.");
      } else {
        console.log("ℹ️  hero_slides.title already exists.");
      }

      // Check if subtitle column exists
      if (!heroColumns["subtitle"]) {
        console.log("➕ Adding subtitle to hero_slides...");
        await sequelize.query(`ALTER TABLE "hero_slides" ADD COLUMN "subtitle" TEXT DEFAULT NULL;`);
        console.log("✅ hero_slides.subtitle added.");
      } else {
        console.log("ℹ️  hero_slides.subtitle already exists.");
      }

      // Check if order column exists
      if (!heroColumns["order"]) {
        console.log("➕ Adding order to hero_slides...");
        await sequelize.query(`ALTER TABLE "hero_slides" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;`);
        console.log("✅ hero_slides.order added.");
      } else {
        console.log("ℹ️  hero_slides.order already exists.");
      }

      // Check if isActive column exists
      if (!heroColumns["isActive"]) {
        console.log("➕ Adding isActive to hero_slides...");
        await sequelize.query(`ALTER TABLE "hero_slides" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT TRUE;`);
        console.log("✅ hero_slides.isActive added.");
      } else {
        console.log("ℹ️  hero_slides.isActive already exists.");
      }
    }

    // ── 6. Add videoFile column to ui_collection_products if missing ──────────
    const productsColumns = await q.describeTable("ui_collection_products").catch(() => null);
    if (productsColumns && !productsColumns["videoFile"]) {
      console.log("➕ Adding videoFile to ui_collection_products...");
      await sequelize.query(`ALTER TABLE "ui_collection_products" ADD COLUMN "videoFile" VARCHAR(1000) DEFAULT NULL;`);
      console.log("✅ ui_collection_products.videoFile added.");
    } else if (productsColumns) {
      console.log("ℹ️  ui_collection_products.videoFile already exists.");
    }

    // ── 7. Create UI tables if missing ─────────────────────────────────────────
    console.log("➕ Creating UI content tables...");

    // ── Add bgGradient to custom_themes BEFORE model sync ─────────────────────
    const customThemeColsEarly = await q.describeTable("custom_themes").catch(() => null);
    if (customThemeColsEarly && !customThemeColsEarly["bgGradient"]) {
      console.log("➕ Adding bgGradient to custom_themes (early)...");
      await sequelize.query(`ALTER TABLE "custom_themes" ADD COLUMN "bgGradient" TEXT DEFAULT NULL;`);
      console.log("✅ custom_themes.bgGradient added.");
    }
    
    // Sync models in explicit order to respect foreign key dependencies
    // Independent tables first
    await User.sync({ force: false, alter: false });
    await Staff.sync({ force: false, alter: false });
    await Category.sync({ force: false, alter: false });
    
    // Tables that depend on categories
    await Product.sync({ force: false, alter: false });
    
    // Tables that depend on products (IMPORTANT: products must exist first)
    await ProductIngredient.sync({ force: false, alter: false });
    await Inventory.sync({ force: false, alter: false });
    await Review.sync({ force: false, alter: false });
    
    // Tables that depend on users/products
    await Wishlist.sync({ force: false, alter: false });
    await Order.sync({ force: false, alter: false });
    
    // Tables that depend on orders
    await OrderItem.sync({ force: false, alter: false });
    
    // Other tables
    await Feedback.sync({ force: false, alter: false });
    await GuestCart.sync({ force: false, alter: false });
    
    // UI-related tables (no dependencies)
    await HeroSection.sync({ force: false, alter: false });
    await OurProductCollectionCategory.sync({ force: false, alter: false });
    await OurProduct.sync({ force: false, alter: false });
    await Testimonial.sync({ force: false, alter: false });
    await AboutUsTitle.sync({ force: false, alter: false });
    await OurStory.sync({ force: false, alter: false });
    await Mission.sync({ force: false, alter: false });
    await OurValues.sync({ force: false, alter: false });
    await ContactInfo.sync({ force: false, alter: false });
    await ContactForm.sync({ force: false, alter: false });

    // ── custom_themes table ────────────────────────────────────────────────────
    const { CustomTheme } = await import("../../features/siteTheme/siteThemeModel");
    await CustomTheme.sync({ force: false, alter: false });
    
    // Seed default themes (Gold & Medical Blue) if they don't exist
    const goldExists = await CustomTheme.findOne({ where: { id: "gold" } });
    if (!goldExists) {
      await CustomTheme.create({
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
      });
      console.log("✅ Gold theme seeded.");
    }
    
    const medicalExists = await CustomTheme.findOne({ where: { id: "medical" } });
    if (!medicalExists) {
      await CustomTheme.create({
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
      });
      console.log("✅ Medical Blue theme seeded.");
    }

    // ── site_theme — singleton config table ───────────────────────────────────
    await SiteTheme.sync({ force: false, alter: false });
    // Seed the singleton row if it doesn't exist
    const themeExists = await q.describeTable("site_theme").catch(() => null);
    if (themeExists) {
      await sequelize.query(`
        INSERT INTO "site_theme" ("id", "activeThemeId", "updatedAt")
        VALUES (1, 'gold', NOW())
        ON CONFLICT ("id") DO NOTHING;
      `);
      console.log("✅ site_theme singleton row ensured.");
    }
    
    console.log("✅ All UI tables verified/created in correct order.");

    // ── 8. Add howToUse and safetyInformation to products if missing ──────────
    const productColsFull = await q.describeTable("products").catch(() => null);
    if (productColsFull) {
      if (!productColsFull["howToUse"]) {
        console.log("➕ Adding howToUse to products...");
        await sequelize.query(`ALTER TABLE "products" ADD COLUMN "howToUse" JSONB NOT NULL DEFAULT '[]';`);
        console.log("✅ products.howToUse added.");
      } else {
        console.log("ℹ️  products.howToUse already exists.");
      }
      if (!productColsFull["safetyInformation"]) {
        console.log("➕ Adding safetyInformation to products...");
        await sequelize.query(`ALTER TABLE "products" ADD COLUMN "safetyInformation" JSONB NOT NULL DEFAULT '[]';`);
        console.log("✅ products.safetyInformation added.");
      } else {
        console.log("ℹ️  products.safetyInformation already exists.");
      }
      if (!productColsFull["productImages"]) {
        console.log("➕ Adding productImages to products...");
        await sequelize.query(`ALTER TABLE "products" ADD COLUMN "productImages" JSONB NOT NULL DEFAULT '[]';`);
        console.log("✅ products.productImages added.");
      } else {
        console.log("ℹ️  products.productImages already exists.");
      }
    }

    // ── 9. Add bgGradient to custom_themes if missing ────────────────────────
    const customThemeColumns = await q.describeTable("custom_themes").catch(() => null);
    if (customThemeColumns) {
      if (!customThemeColumns["bgGradient"]) {
        console.log("➕ Adding bgGradient to custom_themes...");
        await sequelize.query(`ALTER TABLE "custom_themes" ADD COLUMN "bgGradient" TEXT DEFAULT NULL;`);
        console.log("✅ custom_themes.bgGradient added.");
      } else {
        console.log("ℹ️  custom_themes.bgGradient already exists.");
      }

      // Always update default theme gradient values (safe upsert)
      await sequelize.query(`
        UPDATE "custom_themes"
        SET "bgGradient" = 'linear-gradient(160deg, #dff0fb 0%, #eaf6ff 35%, #f4f9fc 65%, #edf5fb 100%)'
        WHERE id = 'gold' AND ("bgGradient" IS NULL OR "bgGradient" = '');
      `);
      await sequelize.query(`
        UPDATE "custom_themes"
        SET "bgGradient" = 'linear-gradient(135deg, #e0f4fb 0%, #f0faff 40%, #e8f5f0 100%)'
        WHERE id = 'medical' AND ("bgGradient" IS NULL OR "bgGradient" = '');
      `);
      console.log("✅ Default themes bgGradient values ensured.");
    }

    // ── 10. Add homeBg to site_theme if missing ──────────────────────────────
    const siteThemeColumns = await q.describeTable("site_theme").catch(() => null);
    if (siteThemeColumns) {
      if (!siteThemeColumns["homeBg"]) {
        console.log("➕ Adding homeBg to site_theme...");
        await sequelize.query(`ALTER TABLE "site_theme" ADD COLUMN "homeBg" VARCHAR(20) NOT NULL DEFAULT 'blue';`);
        console.log("✅ site_theme.homeBg added.");
      } else {
        console.log("ℹ️  site_theme.homeBg already exists.");
      }
    }

    console.log("\n🎉 Migration complete.");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrate();
