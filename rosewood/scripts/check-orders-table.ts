import sequelize from "../src/lib/database/sequelize";

(async () => {
  await sequelize.authenticate();
  const q = sequelize.getQueryInterface();
  
  // Show all columns in orders table
  const cols = await q.describeTable("orders");
  console.log("=== orders table columns ===");
  console.log(JSON.stringify(Object.entries(cols).map(([name, def]) => ({
    name,
    type: (def as { type: string; allowNull?: boolean }).type,
    allowNull: (def as { type: string; allowNull?: boolean }).allowNull,
  })), null, 2));
  
  // Also check order_items
  const itemCols = await q.describeTable("order_items").catch(() => null);
  if (itemCols) {
    console.log("\n=== order_items table columns ===");
    console.log(JSON.stringify(Object.keys(itemCols), null, 2));
  }
  
  await sequelize.close();
})();
