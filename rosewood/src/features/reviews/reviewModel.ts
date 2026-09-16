/* eslint-disable @typescript-eslint/no-empty-object-type */
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "@/lib/database/sequelize";
import User from "@/lib/models/userModel";
import Product from "../products/productModel";

/**
 * Review — customers can review products they've purchased.
 * One customer can only review a product once (unique customerId+productId).
 * rating: 1-5 stars
 * isVerifiedPurchase: true if customer has a delivered order with this product
 */

export interface ReviewAttributes {
  id: string;
  customerId: string;
  productId: string;
  rating: number;                // 1-5
  reviewText: string | null;
  isVerifiedPurchase: boolean;
  isApproved: boolean;           // admin moderation
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReviewCreationAttributes extends Optional<
  ReviewAttributes,
  "id" | "reviewText" | "isVerifiedPurchase" | "isApproved" | "createdAt" | "updatedAt"
> {}

class Review
  extends Model<ReviewAttributes, ReviewCreationAttributes>
  implements ReviewAttributes
{
  declare id: string;
  declare customerId: string;
  declare productId: string;
  declare rating: number;
  declare reviewText: string | null;
  declare isVerifiedPurchase: boolean;
  declare isApproved: boolean;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

Review.init(
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
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    reviewText: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    isVerifiedPurchase: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isApproved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    modelName: "Review",
    tableName: "reviews",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["customerId", "productId"],
        name: "uq_review_customer_product",
      },
    ],
  },
);

Review.belongsTo(User,    { foreignKey: "customerId", as: "customer" });
Review.belongsTo(Product, { foreignKey: "productId",  as: "product"  });
Product.hasMany(Review,   { foreignKey: "productId",  as: "reviews"  });

export default Review;
