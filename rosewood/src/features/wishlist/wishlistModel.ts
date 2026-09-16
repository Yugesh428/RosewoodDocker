/* eslint-disable @typescript-eslint/no-empty-object-type */
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "@/lib/database/sequelize";
import User from "@/lib/models/userModel";
import Product from "../products/productModel";

/**
 * Wishlist — one row per customer+product pair (unique together).
 * A customer cannot add the same product twice.
 */

export interface WishlistAttributes {
  id: string;
  customerId: string;
  productId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WishlistCreationAttributes extends Optional<
  WishlistAttributes,
  "id" | "createdAt" | "updatedAt"
> {}

class Wishlist
  extends Model<WishlistAttributes, WishlistCreationAttributes>
  implements WishlistAttributes
{
  declare id: string;
  declare customerId: string;
  declare productId: string;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

Wishlist.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "products", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
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
    modelName: "Wishlist",
    tableName: "wishlists",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["customerId", "productId"],
        name: "uq_wishlist_customer_product",
      },
    ],
  },
);

Wishlist.belongsTo(User,    { foreignKey: "customerId", as: "customer" });
Wishlist.belongsTo(Product, { foreignKey: "productId",  as: "product"  });
User.hasMany(Wishlist,      { foreignKey: "customerId", as: "wishlist"  });

export default Wishlist;
