/* eslint-disable @typescript-eslint/no-empty-object-type */
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "@/lib/database/sequelize";
import User from "@/lib/models/userModel";

/**
 * Feedback — general customer feedback about the service/website.
 * NOT tied to a specific product (use Review for that).
 * Optional customerId (guests can submit feedback too).
 */

export type FeedbackStatus = "pending" | "reviewed" | "resolved";

export interface FeedbackAttributes {
  id: string;
  customerId: string | null;     // nullable: guests can leave feedback
  customerName: string | null;   // for guests who don't have an account
  customerEmail: string | null;  // for guests
  feedbackText: string;
  status: FeedbackStatus;
  adminNotes: string | null;     // internal notes
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FeedbackCreationAttributes extends Optional<
  FeedbackAttributes,
  "id" | "customerId" | "customerName" | "customerEmail" | "status" | "adminNotes" | "createdAt" | "updatedAt"
> {}

class Feedback
  extends Model<FeedbackAttributes, FeedbackCreationAttributes>
  implements FeedbackAttributes
{
  declare id: string;
  declare customerId: string | null;
  declare customerName: string | null;
  declare customerEmail: string | null;
  declare feedbackText: string;
  declare status: FeedbackStatus;
  declare adminNotes: string | null;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

Feedback.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
      references: { model: "users", key: "id" },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
    customerName: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: null,
    },
    customerEmail: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: null,
    },
    feedbackText: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "reviewed", "resolved"),
      allowNull: false,
      defaultValue: "pending",
    },
    adminNotes: {
      type: DataTypes.TEXT,
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
    modelName: "Feedback",
    tableName: "feedback",
    timestamps: true,
  },
);

Feedback.belongsTo(User, { foreignKey: "customerId", as: "customer" });
User.hasMany(Feedback,   { foreignKey: "customerId", as: "feedback" });

export default Feedback;
