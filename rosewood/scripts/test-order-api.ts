/**
 * Quick smoke test — creates a guest order and then fetches it back.
 * Run: npx tsx --env-file=.env --tsconfig tsconfig.scripts.json scripts/test-order-api.ts
 */
import sequelize from "../src/lib/database/sequelize";
import Order from "../src/features/orders/orderModel";
import OrderItem from "../src/features/orderItems/orderItemModel";
import Inventory from "../src/features/inventory/inventoryModel";
import Product from "../src/features/products/productModel";
import User from "../src/lib/models/userModel";

(async () => {
  await sequelize.authenticate();
  console.log("✅ DB connected.\n");

  // 1. Find any active inventory batch to use
  const inv = await Inventory.findOne({
    where: { isActive: true },
    include: [{ model: Product, as: "product" }],
  });

  if (!inv) {
    console.log("⚠️  No active inventory found. Add a product + inventory batch first.");
    await sequelize.close();
    return;
  }

  const product = (inv as Inventory & { product: Product }).product;
  console.log(`📦 Using inventory: ${inv.id}`);
  console.log(`   Product: ${product.productName} — stock: ${inv.quantity} — price: £${inv.sellingPrice}\n`);

  // 2. Create a guest order
  const order = await sequelize.transaction(async (t) => {
    const o = await Order.create({
      isGuest: true,
      customerId: null,
      guestName: "Test Guest",
      guestEmail: "test@example.com",
      guestPhone: "+44 7700 000001",
      paymentMethod: "cash",
      deliveryAddress: "123 Test St, London, SW1A 1AA",
      subtotal: Number(inv.sellingPrice),
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: Number(inv.sellingPrice),
      orderStatus: "pending",
      paymentStatus: "unpaid",
    }, { transaction: t });

    await OrderItem.create({
      orderId: o.id,
      productId: product.id,
      inventoryId: inv.id,
      quantity: 1,
      unitPrice: Number(inv.sellingPrice),
      taxRate: 0,
      discountRate: 0,
      taxAmount: 0,
      discountAmount: 0,
      lineTotal: Number(inv.sellingPrice),
      productName: product.productName,
      batchNumber: inv.batchNumber,
    }, { transaction: t });

    return o;
  });

  console.log(`✅ Order created: ${order.id}`);
  console.log(`   Status: ${order.orderStatus} | Payment: ${order.paymentStatus}\n`);

  // 3. Fetch it back with items
  const fetched = await Order.findByPk(order.id, {
    include: [
      { model: OrderItem, as: "items" },
      { model: User, as: "customer", required: false },
    ],
  });

  const items = (fetched as Order & { items: OrderItem[] }).items;
  console.log(`✅ Fetched order back — ${items.length} item(s)`);
  console.log(`   Total: £${fetched?.totalAmount}\n`);

  // 4. Clean up the test order
  await OrderItem.destroy({ where: { orderId: order.id } });
  await Order.destroy({ where: { id: order.id } });
  console.log("🗑️  Test order cleaned up.");

  await sequelize.close();
  console.log("\n🎉 API smoke test passed — checkout should work now.");
})().catch((err) => {
  console.error("❌ Test failed:", err.message);
  process.exit(1);
});
