// app/api/ui/contact-info/contactInfoModel.ts

import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import sequelize from "../../../../lib/database/sequelize";

class ContactInfo extends Model<
  InferAttributes<ContactInfo>,
  InferCreationAttributes<ContactInfo>
> {
  declare id: CreationOptional<string>;
  declare address: string;          // multi-line address
  declare phone: string;
  declare email: string;
  declare hours: string;            // multi-line opening hours
  declare latitude: CreationOptional<number | null>;   // map pin lat  e.g. 40.7165
  declare longitude: CreationOptional<number | null>;  // map pin lng  e.g. -74.0005

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

ContactInfo.init(
  {
      id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
      },
      address: {
          type: DataTypes.TEXT,
          allowNull: false,
          validate: {
              notEmpty: { msg: "Address is required" },
          },
      },
      phone: {
          type: DataTypes.STRING(50),
          allowNull: false,
          validate: {
              notEmpty: { msg: "Phone is required" },
          },
      },
      email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          validate: {
              isEmail: { msg: "Invalid email address" },
              notEmpty: { msg: "Email is required" },
          },
      },
      hours: {
          type: DataTypes.TEXT,
          allowNull: false,
          validate: {
              notEmpty: { msg: "Opening hours are required" },
          },
      },
      latitude: {
          type: DataTypes.FLOAT,
          allowNull: true,
          defaultValue: null,
      },
      longitude: {
          type: DataTypes.FLOAT,
          allowNull: true,
          defaultValue: null,
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
    tableName: "contact_info",
    timestamps: true,
    freezeTableName: true,
  },
);

export default ContactInfo;
