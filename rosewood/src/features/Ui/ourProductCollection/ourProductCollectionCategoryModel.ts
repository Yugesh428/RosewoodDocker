import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  HasManyGetAssociationsMixin,
  HasManyCreateAssociationMixin,
} from "sequelize";
import sequelize from "../../../lib/database/sequelize";

/**
 * CollectionCategory — UI tab labels for the "Our Product Collection" section.
 *
 * These are the filter tabs (e.g. "Skincare", "Wellness", "Personal Care").
 * No image here — images belong to CollectionItem cards.
 *
 * Deleting a category cascades to all its collection items automatically.
 */
class CollectionCategory extends Model<
  InferAttributes<CollectionCategory>,
  InferCreationAttributes<CollectionCategory>
> {
  declare id: CreationOptional<string>;
  declare name: string;          // e.g. "Skincare"
  declare slug: string;          // e.g. "skincare"
  declare description: CreationOptional<string | null>;
  declare displayOrder: CreationOptional<number>;  // controls tab ordering
  declare isActive: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Association helpers
  declare getItems: HasManyGetAssociationsMixin<CollectionItem>;
  declare createItem: HasManyCreateAssociationMixin<CollectionItem, "categoryId">;
  // Populated when queried with include: [{ model: CollectionItem, as: "items" }]
  declare items?: CollectionItem[];
}

CollectionCategory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Category name is required" },
      },
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        is: { args: /^[a-z0-9-]+$/, msg: "Slug must be lowercase letters, numbers, or hyphens" },
        notEmpty: { msg: "Slug is required" },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: "ui_collection_categories",
    timestamps: true,
    freezeTableName: true,
    indexes: [
      { fields: ["slug"], unique: true },
      { fields: ["displayOrder"] },
      { fields: ["isActive"] },
    ],
  },
);

// ─── CollectionItem ───────────────────────────────────────────────────────────
// Each card in the mosaic grid. Belongs to a CollectionCategory.
// Deleting the parent category cascades and removes all its items.

export class CollectionItem extends Model<
  InferAttributes<CollectionItem>,
  InferCreationAttributes<CollectionItem>
> {
  declare id: CreationOptional<string>;
  declare categoryId: string;     // FK → ui_collection_categories.id (CASCADE)
  declare title: string;          // e.g. "Advanced Skincare Regime"
  declare imageUrl: string;       // uploaded image path or URL
  declare displayOrder: CreationOptional<number>;
  declare isActive: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

CollectionItem.init(
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
      onDelete: "CASCADE",   // item deleted when its category is deleted
      onUpdate: "CASCADE",
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Item title is required" },
      },
    },
    imageUrl: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Image URL is required" },
      },
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: "ui_collection_items",
    timestamps: true,
    freezeTableName: true,
    indexes: [
      { fields: ["categoryId"] },
      { fields: ["displayOrder"] },
      { fields: ["isActive"] },
    ],
  },
);

// ─── Associations ─────────────────────────────────────────────────────────────
// Category → has many Items (CASCADE delete/update)
// Item     → belongs to Category

CollectionCategory.hasMany(CollectionItem, {
  foreignKey: "categoryId",
  as: "items",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
  hooks: true,        // ensures beforeDestroy hooks fire on each child
});

CollectionItem.belongsTo(CollectionCategory, {
  foreignKey: "categoryId",
  as: "category",
});

export { CollectionCategory };
export default CollectionCategory;
