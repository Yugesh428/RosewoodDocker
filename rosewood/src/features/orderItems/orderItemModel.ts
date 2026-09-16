/* eslint-disable @typescript-eslint/no-empty-object-type */
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "@/lib/database/sequelize";
import Order from "../orders/orderModel";
import Product from "../products/productModel";
import Inventory from "../inventory/inventoryModel";

/**
 * Business rules:
 * - Each OrderItem is a line in the order: one product, one batch, one quantity.
 * - sellingPrice, tax, discount are snapshotted from Inventory/Product at order time
 *   so historical totals are preserved even if prices change later.
 * - inventoryId (batchId) is stored to know which batch to deduct/restore.
 * - lineTotal = (sellingPrice × quantity) + taxAmount - discountAmount
 */

export interface OrderItemAttributes {
  id: string;
  orderId: string;
  productId: string;
  inventoryId: string;       // which batch was used (for deduct/restore)

  // Quantity
  quantity: number;

  // Price snapshot at order time
  unitPrice: number;         // sellingPrice from inventory at order time
  taxRate: number;           // tax % from product at order time
  discountRate: number;      // discount % from product at order time
  taxAmount: number;         // computed: unitPrice × quantity × taxRate / 100
  discountAmount: number;    // computed: unitPrice × quantity × discountRate / 100
  lineTotal: number;         // (unitPrice × quantity) + taxAmount - discountAmount

  // Product snapshot (for display without joins)
  productName: string;
  batchNumber: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderItemCreationAttributes extends Optional<
  OrderItemAttributes,
  "id" | "taxAmount" | "discountAmount" | "createdAt" | "updatedAt"
> {}

class OrderItem
  extends Model<OrderItemAttributes, OrderItemCreationAttributes>
  implements OrderItemAttributes
{
  declare id: string;
  declare orderId: string;
  declare productId: string;
  declare inventoryId: string;
  declare quantity: number;
  declare unitPrice: number;
  declare taxRate: number;
  declare discountRate: number;
  declare taxAmount: number;
  declare discountAmount: number;
  declare lineTotal: number;
  declare productName: string;
  declare batchNumber: string;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

OrderItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "orders", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "products", key: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    inventoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "inventories", key: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    taxRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discountRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    lineTotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    productName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    batchNumber: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "OrderItem",
    tableName: "order_items",
    timestamps: true,
  },
);

// Associations
OrderItem.belongsTo(Order,     { foreignKey: "orderId",     as: "order" });
OrderItem.belongsTo(Product,   { foreignKey: "productId",   as: "product" });
OrderItem.belongsTo(Inventory, { foreignKey: "inventoryId", as: "inventory" });

Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" });

export default OrderItem;
