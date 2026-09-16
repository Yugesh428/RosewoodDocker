/* eslint-disable @typescript-eslint/no-empty-object-type */
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "@/lib/database/sequelize";
import Product from "../products/productModel";

/**
 * Business rules:
 * - No stock reservation. Orders are placed after payment is confirmed.
 * - Delivery deducts stock. Order cancellation restores stock.
 * - One inventory record per product+batch combination.
 * - stockStatus is derived, not stored: computed from quantity vs lowStockThreshold.
 */

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export interface InventoryAttributes {
  id: string;
  productId: string;
  batchNumber: string;
  quantity: number;           // current physical stock
  manufacturingDate: Date;
  expiryDate: Date;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  supplierName: string;
  lowStockThreshold: number;  // quantity at or below which "low-stock" is triggered
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InventoryCreationAttributes extends Optional<
  InventoryAttributes,
  "id" | "lowStockThreshold" | "isActive" | "createdAt" | "updatedAt"
> {}

class Inventory
  extends Model<InventoryAttributes, InventoryCreationAttributes>
  implements InventoryAttributes
{
  declare id: string;
  declare productId: string;
  declare batchNumber: string;
  declare quantity: number;
  declare manufacturingDate: Date;
  declare expiryDate: Date;
  declare purchasePrice: number;
  declare sellingPrice: number;
  declare mrp: number;
  declare supplierName: string;
  declare lowStockThreshold: number;
  declare isActive: boolean;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;

  // ── Derived stock status (no reserved concept) ────────────────────────────
  getStockStatus(): StockStatus {
    if (this.quantity <= 0)                    return "out-of-stock";
    if (this.quantity <= this.lowStockThreshold) return "low-stock";
    return "in-stock";
  }

  // ── Deduct stock on delivery ───────────────────────────────────────────────
  async deductStock(amount: number): Promise<void> {
    if (amount <= 0) throw new Error("Deduct amount must be positive.");
    if (this.quantity < amount) {
      throw new Error(
        `Insufficient stock. Available: ${this.quantity}, requested: ${amount}.`,
      );
    }
    await this.update({ quantity: this.quantity - amount });
  }

  // ── Restore stock on order cancellation ───────────────────────────────────
  async restoreStock(amount: number): Promise<void> {
    if (amount <= 0) throw new Error("Restore amount must be positive.");
    await this.update({ quantity: this.quantity + amount });
  }

  // ── Quick availability check ───────────────────────────────────────────────
  hasStock(amount: number = 1): boolean {
    return this.quantity >= amount;
  }
}

Inventory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "products", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    batchNumber: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0 },
    },
    manufacturingDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    purchasePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    sellingPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    mrp: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    supplierName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    lowStockThreshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      validate: { min: 0 },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    modelName: "Inventory",
    tableName: "inventories",
    timestamps: true,
  },
);

// Associations
Inventory.belongsTo(Product, { foreignKey: "productId", as: "product" });
Product.hasMany(Inventory, { foreignKey: "productId", as: "inventories" });

export default Inventory;
