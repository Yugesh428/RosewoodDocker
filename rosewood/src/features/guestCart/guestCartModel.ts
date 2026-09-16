import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "@/lib/database/sequelize";
import Product from "../products/productModel";
import Inventory from "../inventory/inventoryModel";

/**
 * Guest Cart Model
 * ─────────────────────────────────────────────────────────────────────────────
 * For non-logged-in users to save their cart items temporarily.
 * Uses sessionId (generated client-side, stored in cookie/localStorage).
 * Auto-expires after 7 days of inactivity.
 */

export interface GuestCartAttributes {
  id: string;
  sessionId: string;         // Client-generated unique ID (UUID)
  productId: string;
  inventoryId: string;
  quantity: number;
  expiresAt: Date;          // Auto-delete after 7 days
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GuestCartCreationAttributes extends Optional<
  GuestCartAttributes,
  "id" | "expiresAt" | "createdAt" | "updatedAt"
> {}

class GuestCart
  extends Model<GuestCartAttributes, GuestCartCreationAttributes>
  implements GuestCartAttributes
{
  declare id: string;
  declare sessionId: string;
  declare productId: string;
  declare inventoryId: string;
  declare quantity: number;
  declare expiresAt: Date;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

GuestCart.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    sessionId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "Client-generated session ID (UUID from cookie/localStorage)",
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "products", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    inventoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "inventories", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: () => {
        const date = new Date();
        date.setDate(date.getDate() + 7); // 7 days from now
        return date;
      },
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
    modelName: "GuestCart",
    tableName: "guest_carts",
    timestamps: true,
    indexes: [
      { fields: ["sessionId"] },
      { fields: ["sessionId", "productId"], unique: true }, // One product per session
      { fields: ["expiresAt"] }, // For cleanup queries
    ],
  },
);

// Associations
GuestCart.belongsTo(Product, { foreignKey: "productId", as: "product" });
GuestCart.belongsTo(Inventory, { foreignKey: "inventoryId", as: "inventory" });

export default GuestCart;
