/**
 * One-time fix: drop all legacy columns from the orders table
 * that conflict with the current Sequelize model.
 *
 * Run: npx tsx --env-file=.env --tsconfig tsconfig.scripts.json scripts/fix-orders-schema.ts
 */
import sequelize from "../src/lib/database/sequelize";

const LEGACY_COLUMNS = [
  "productId",
  "productName",
  "productImage",
  "productDescription",
  "price",
  "currency",
  "quantity",
  "firstName",
  "lastName",
  "streetAddress",
  "city",
  "state",
  "postalCode",
  "country",
  "cardLast4",
  "status",   // old ENUM — replaced by orderStatus
];

(async () => {
  await sequelize.authenticate();
  console.log("✅ DB connected.");

  const q = sequelize.getQueryInterface();
  const cols = await q.describeTable("orders");

  for (const col of LEGACY_COLUMNS) {
    if (cols[col]) {
      try {
        // Drop FK constraints that reference this column first (if any)
        await sequelize.query(
          `ALTER TABLE "orders" DROP COLUMN IF EXISTS "${col}" CASCADE;`
        );
        console.log(`🗑️  Dropped orders.${col}`);
      } catch (err) {
        console.error(`❌ Failed to drop orders.${col}:`, err);
      }
    } else {
      console.log(`ℹ️  orders.${col} not found — skipping`);
    }
  }

  // Verify the clean set of columns
  const cleanCols = await q.describeTable("orders");
  console.log("\n✅ Remaining orders columns:", Object.keys(cleanCols).join(", "));

  await sequelize.close();
  console.log("\n🎉 Done. orders table is now clean.");
})();
