// app/api/ui/contact/contactModel.ts

import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import sequelize from "../../../../lib/database/sequelize";

class ContactMessage extends Model<
  InferAttributes<ContactMessage>,
  InferCreationAttributes<ContactMessage>
> {
  declare id: CreationOptional<string>;
  declare fullName: string;
  declare email: string;
  declare phone: string | null;
  declare message: string;
  declare isRead: CreationOptional<boolean>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

ContactMessage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Full name is required" },
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
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Message is required" },
      },
    },
    isRead: {
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
    tableName: "contact_messages",
    timestamps: true,
    freezeTableName: true,
    indexes: [
      { fields: ["email"] },
      { fields: ["isRead"] },
      { fields: ["createdAt"] },
    ],
  },
);

export default ContactMessage;
