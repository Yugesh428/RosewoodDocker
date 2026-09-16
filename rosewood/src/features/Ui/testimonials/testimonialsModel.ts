// app/api/ui/testimonials/testimonialModel.ts

import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import sequelize from "../../../lib/database/sequelize";

class Testimonial extends Model<
  InferAttributes<Testimonial>,
  InferCreationAttributes<Testimonial>
> {
  declare id: CreationOptional<string>;
  declare photo: string; // image URL (avatar)
  declare rating: number; // 1–5
  declare quote: string;
  declare authorName: string;
  declare authorTitle: string | null; // e.g., "Verified Customer"
  declare displayOrder: CreationOptional<number>;
  declare isActive: CreationOptional<boolean>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Testimonial.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    photo: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      validate: { notEmpty: { msg: "Photo is required" } },
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    quote: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: { msg: "Quote is required" } },
    },
    authorName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: { msg: "Author name is required" } },
    },
    authorTitle: {
      type: DataTypes.STRING(255),
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
    tableName: "testimonials",
    timestamps: true,
    freezeTableName: true,
    indexes: [{ fields: ["displayOrder"] }, { fields: ["isActive"] }],
  },
);

export default Testimonial;
