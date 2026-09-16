// app/api/ui/about/aboutModel.ts

import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import sequelize from "../../../../lib/database/sequelize";

class AboutUs extends Model<
  InferAttributes<AboutUs>,
  InferCreationAttributes<AboutUs>
> {
  declare id: CreationOptional<string>;
  declare description: string; // the main content (HTML or plain text)

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

AboutUs.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Description is required" },
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
    tableName: "about_us",
    timestamps: true,
    freezeTableName: true,
  },
);

export default AboutUs;
