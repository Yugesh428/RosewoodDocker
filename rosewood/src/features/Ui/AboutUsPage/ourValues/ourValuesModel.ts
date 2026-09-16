// app/api/ui/values/valuesModel.ts

import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import sequelize from "../../../../lib/database/sequelize";

class Value extends Model<
  InferAttributes<Value>,
  InferCreationAttributes<Value>
> {
  declare id: CreationOptional<string>;
  declare title: string; // e.g., "Trust", "Quality", "Care", "Reliability"
  declare description: string; // the main paragraph
  declare imageUrl: string | null; // optional image (replaces avatar later)
  declare displayOrder: CreationOptional<number>;
  declare isActive: CreationOptional<boolean>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Value.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Title is required" },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Description is required" },
      },
    },
    imageUrl: {
      type: DataTypes.STRING(1000),
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
    tableName: "values",
    timestamps: true,
    freezeTableName: true,
    indexes: [{ fields: ["displayOrder"] }, { fields: ["isActive"] }],
  },
);

export default Value;
