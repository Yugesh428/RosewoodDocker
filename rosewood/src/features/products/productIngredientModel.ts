/* eslint-disable @typescript-eslint/no-empty-object-type */
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../lib/database/sequelize";
import Product from "./productModel";

/**
 * ProductIngredient — each row is one ingredient line for a product.
 * e.g.  { ingredientName: "Paracetamol", quantity: "500", unit: "mg" }
 *
 * sortOrder controls display order on the frontend.
 */

export interface ProductIngredientAttributes {
  id: string;
  productId: string;
  ingredientName: string;
  quantity: string | null;    // e.g. "500", "10", null if not specified
  unit: string | null;        // e.g. "mg", "mcg", "IU", "%w/v"
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductIngredientCreationAttributes extends Optional<
  ProductIngredientAttributes,
  "id" | "quantity" | "unit" | "sortOrder" | "createdAt" | "updatedAt"
> {}

class ProductIngredient
  extends Model<ProductIngredientAttributes, ProductIngredientCreationAttributes>
  implements ProductIngredientAttributes
{
  declare id: string;
  declare productId: string;
  declare ingredientName: string;
  declare quantity: string | null;
  declare unit: string | null;
  declare sortOrder: number;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

ProductIngredient.init(
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
    ingredientName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    modelName: "ProductIngredient",
    tableName: "product_ingredients",
    timestamps: true,
  },
);

// Associations
ProductIngredient.belongsTo(Product, { foreignKey: "productId", as: "product" });
Product.hasMany(ProductIngredient,   { foreignKey: "productId", as: "ingredients" });

export default ProductIngredient;
