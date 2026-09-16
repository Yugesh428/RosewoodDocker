/* eslint-disable @typescript-eslint/no-empty-object-type */
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../lib/database/sequelize";

export interface CategoryAttributes {
  id: string;
  categoryName: string;
  categoryDescription: string;
  parentId: string | null; // null = top-level category, UUID = subcategory of that parent
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CategoryCreationAttributes extends Optional<
  CategoryAttributes,
  "id" | "parentId" | "isActive" | "createdAt" | "updatedAt"
> {}

class Category
  extends Model<CategoryAttributes, CategoryCreationAttributes>
  implements CategoryAttributes
{
  declare id: string;
  declare categoryName: string;
  declare categoryDescription: string;
  declare parentId: string | null;
  declare isActive: boolean;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

Category.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    categoryName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    categoryDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
      references: { model: "categories", key: "id" },
      onDelete: "CASCADE", // if parent deleted, subcategories cascade
      onUpdate: "CASCADE",
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
    modelName: "Category",
    tableName: "categories",
    timestamps: true,
  },
);

// Self-referential associations
Category.hasMany(Category, {
  as: "subCategories",
  foreignKey: "parentId",
});
Category.belongsTo(Category, {
  as: "parentCategory",
  foreignKey: "parentId",
});

export default Category;
