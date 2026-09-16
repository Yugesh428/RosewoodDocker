/* eslint-disable @typescript-eslint/no-empty-object-type */
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "@/lib/database/sequelize";

/**
 * Staff is a pure record — no auth, no login.
 * Managed by admins only (add / edit / deactivate).
 * Can be bulk-imported from Excel.
 */

export type StaffRole =
  | "pharmacist"
  | "cashier"
  | "store_manager"
  | "delivery"
  | "inventory_clerk"
  | "other";

export interface StaffAttributes {
  id: string;
  fullName: string;
  employeeCode: string;      // unique identifier e.g. EMP-001
  role: StaffRole;
  phone: string;
  email: string | null;
  address: string | null;
  dateOfJoining: Date;
  salary: number;
  isActive: boolean;
  notes: string | null;      // any extra admin notes
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StaffCreationAttributes extends Optional<
  StaffAttributes,
  | "id"
  | "email"
  | "address"
  | "salary"
  | "isActive"
  | "notes"
  | "createdAt"
  | "updatedAt"
> {}

class Staff
  extends Model<StaffAttributes, StaffCreationAttributes>
  implements StaffAttributes
{
  declare id: string;
  declare fullName: string;
  declare employeeCode: string;
  declare role: StaffRole;
  declare phone: string;
  declare email: string | null;
  declare address: string | null;
  declare dateOfJoining: Date;
  declare salary: number;
  declare isActive: boolean;
  declare notes: string | null;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

Staff.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    employeeCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    role: {
      type: DataTypes.ENUM(
        "pharmacist",
        "cashier",
        "store_manager",
        "delivery",
        "inventory_clerk",
        "other",
      ),
      allowNull: false,
      defaultValue: "other",
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: null,
      validate: { isEmail: true },
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    dateOfJoining: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    salary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    notes: {
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
    modelName: "Staff",
    tableName: "staff",
    timestamps: true,
  },
);

export default Staff;
