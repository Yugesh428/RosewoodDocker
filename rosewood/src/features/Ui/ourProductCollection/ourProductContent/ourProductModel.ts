import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  BelongsToGetAssociationMixin,
} from "sequelize";
import sequelize from "../../../../lib/database/sequelize";
import CollectionCategory from "../ourProductCollectionCategoryModel";

/**
 * Product — a UI collection card that belongs to a CollectionCategory tab.
 *
 * Each card can have:
 *  - a background image (mosaic grid card image)
 *  - an optional video URL
 *  - two optional secondary photos with their own title/subtitle
 *
 * Deleting the parent CollectionCategory cascades and removes this product.
 */
class Product extends Model<
  InferAttributes<Product>,
  InferCreationAttributes<Product>
> {
  declare id: CreationOptional<string>;
  declare categoryId: ForeignKey<string>;   // FK → ui_collection_categories.id (CASCADE)
  declare title: string;
  declare subtitle: CreationOptional<string | null>;
  declare backgroundImage: CreationOptional<string | null>;
  declare videoUrl: CreationOptional<string | null>;       // External video URL
  declare videoFile: CreationOptional<string | null>;      // Uploaded video file path

  // Secondary photos with their own labels
  declare photo1Url: CreationOptional<string | null>;
  declare photo1Title: CreationOptional<string | null>;
  declare photo1Subtitle: CreationOptional<string | null>;

  declare photo2Url: CreationOptional<string | null>;
  declare photo2Title: CreationOptional<string | null>;
  declare photo2Subtitle: CreationOptional<string | null>;

  declare isActive: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Association helper
  declare getCategory: BelongsToGetAssociationMixin<CollectionCategory>;
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
      references: { model: "ui_collection_categories", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: { msg: "Product title is required" } },
    },
    subtitle: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    backgroundImage: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      defaultValue: null,
    },
    videoUrl: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      defaultValue: null,
    },
    videoFile: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      defaultValue: null,
    },
    photo1Url: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      defaultValue: null,
    },
    photo1Title: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    photo1Subtitle: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    photo2Url: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      defaultValue: null,
    },
    photo2Title: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    photo2Subtitle: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
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
    tableName: "ui_collection_products",
    timestamps: true,
    freezeTableName: true,
    indexes: [
      { fields: ["categoryId"] },
      { fields: ["isActive"] },
    ],
  },
);

// ─── Association ──────────────────────────────────────────────────────────────
// Product belongs to CollectionCategory (CASCADE from category model handles delete)
Product.belongsTo(CollectionCategory, {
  foreignKey: "categoryId",
  as: "category",
});

export default Product;
