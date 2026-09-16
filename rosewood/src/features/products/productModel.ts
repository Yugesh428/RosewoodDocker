/* eslint-disable @typescript-eslint/no-empty-object-type */
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../lib/database/sequelize";
import Category from "../productCategory/productCatetgoryModel";

/**
 * productDescriptions — JSONB array, each section has its own title + content.
 * [
 *   { title: "How to use",   content: "Take 1 tablet after meals." },
 *   { title: "Side effects", content: "Nausea, dizziness." },
 *   { title: "Storage",      content: "Store below 25°C." }
 * ]
 *
 * specifications — JSONB array for technical specs
 * [
 *   { key: "Manufacturer", value: "PharmaCo Ltd" },
 *   { key: "Country of Origin", value: "India" },
 *   { key: "Shelf Life", value: "24 months" }
 * ]
 *
 * suitableFor — JSONB string array for dietary/lifestyle tags
 * ["vegetarian", "vegan", "gluten_free", "lactose_free", "diabetic_friendly",
 *  "children", "adults", "elderly", "pregnant_women"]
 *
 * ingredients — managed via the separate ProductIngredient table.
 */

export interface ProductDescription {
  title: string;
  content: string;
}

export interface ProductSpecification {
  key: string;
  value: string;
}

export interface ProductAttributes {
  id: string;
  categoryId: string;
  productName: string;
  productImage: string | null;
  productImages: string[];
  dosageForm: string;
  strength: string;
  packSize: string;
  unitType: string;
  sellingPrice: number;
  originalPrice: number;
  tax: number;
  discount: number;
  productDescriptions: ProductDescription[];  // Array: [{ title, content }, ...]
  specifications: ProductSpecification[];     // Array: [{ key, value }, ...]
  suitableFor: string[];                      // Array: ["vegetarian", "vegan", "children", ...]
  howToUse: string[];                         // Array of how-to-use steps
  safetyInformation: string[];                // Array of safety information points
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductCreationAttributes extends Optional<
  ProductAttributes,
  "id" | "productImage" | "productImages" | "productDescriptions" | "specifications" | "suitableFor" | "howToUse" | "safetyInformation" | "isActive" | "createdAt" | "updatedAt"
> {}

class Product
  extends Model<ProductAttributes, ProductCreationAttributes>
  implements ProductAttributes
{
  declare id: string;
  declare categoryId: string;
  declare productName: string;
  declare productImage: string | null;
  declare productImages: string[];
  declare dosageForm: string;
  declare strength: string;
  declare packSize: string;
  declare unitType: string;
  declare sellingPrice: number;
  declare originalPrice: number;
  declare tax: number;
  declare discount: number;
  declare productDescriptions: ProductDescription[];
  declare specifications: ProductSpecification[];
  declare suitableFor: string[];
  declare howToUse: string[];
  declare safetyInformation: string[];
  declare isActive: boolean;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "categories", key: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    productName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    productImage: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      defaultValue: null,
    },
    productImages: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      comment: "Array of additional image URLs/paths for the product gallery",
    },
    dosageForm: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    strength: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    packSize: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    unitType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    sellingPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    originalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    tax: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discount: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    productDescriptions: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      comment: "Array of { title, content } objects for product descriptions",
    },
    specifications: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      comment: "Array of { key, value } objects for technical specifications",
    },
    suitableFor: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      comment: "Array of strings: vegetarian, vegan, gluten_free, lactose_free, diabetic_friendly, children, adults, elderly, etc.",
    },
    howToUse: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      comment: "Array of how-to-use instruction strings",
    },
    safetyInformation: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      comment: "Array of safety information strings",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
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
    modelName: "Product",
    tableName: "products",
    timestamps: true,
  },
);

Product.belongsTo(Category, { foreignKey: "categoryId", as: "category" });
Category.hasMany(Product,   { foreignKey: "categoryId", as: "products" });

export default Product;
