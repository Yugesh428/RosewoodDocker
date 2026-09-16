/* eslint-disable @typescript-eslint/no-empty-object-type */
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "@/lib/database/sequelize";
import User from "@/lib/models/userModel";

/**
 * Business rules:
 * - Orders are placed AFTER payment is confirmed (no reservation).
 * - Delivery triggers stock deduction via inventory controller.
 * - Cancellation triggers stock restoration via inventory controller.
 * - Status flow: pending → confirmed → processing → shipped → delivered
 *                           └──────────────────────────────→ cancelled
 */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

export type PaymentMethod = "cash" | "card" | "online" | "upi";

export interface OrderAttributes {
  id: string;
  customerId: string | null;        // NULL for guest orders
  isGuest: boolean;                 // TRUE for guest orders
  guestName: string | null;         // Guest customer name
  guestEmail: string | null;        // Guest customer email
  guestPhone: string | null;        // Guest customer phone
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;

  // Pricing snapshot (captured at order time)
  subtotal: number;          // sum of (sellingPrice × quantity) before tax/discount
  taxAmount: number;         // total tax applied
  discountAmount: number;    // total discount applied
  totalAmount: number;       // final payable amount

  // Delivery info
  deliveryAddress: string;
  deliveryNotes: string | null;

  // Timestamps for status changes
  confirmedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderCreationAttributes extends Optional<
  OrderAttributes,
  | "id"
  | "customerId"
  | "isGuest"
  | "guestName"
  | "guestEmail"
  | "guestPhone"
  | "orderStatus"
  | "paymentStatus"
  | "taxAmount"
  | "discountAmount"
  | "deliveryNotes"
  | "confirmedAt"
  | "shippedAt"
  | "deliveredAt"
  | "cancelledAt"
  | "cancellationReason"
  | "createdAt"
  | "updatedAt"
> {}

class Order
  extends Model<OrderAttributes, OrderCreationAttributes>
  implements OrderAttributes
{
  declare id: string;
  declare customerId: string | null;
  declare isGuest: boolean;
  declare guestName: string | null;
  declare guestEmail: string | null;
  declare guestPhone: string | null;
  declare orderStatus: OrderStatus;
  declare paymentStatus: PaymentStatus;
  declare paymentMethod: PaymentMethod;
  declare subtotal: number;
  declare taxAmount: number;
  declare discountAmount: number;
  declare totalAmount: number;
  declare deliveryAddress: string;
  declare deliveryNotes: string | null;
  declare confirmedAt: Date | null;
  declare shippedAt: Date | null;
  declare deliveredAt: Date | null;
  declare cancelledAt: Date | null;
  declare cancellationReason: string | null;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;

  // ── Status transition helpers ──────────────────────────────────────────────

  canTransitionTo(next: OrderStatus): boolean {
    const allowed: Record<OrderStatus, OrderStatus[]> = {
      pending:    ["confirmed", "cancelled"],
      confirmed:  ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped:    ["delivered", "cancelled"],
      delivered:  [],
      cancelled:  [],
    };
    return allowed[this.orderStatus]?.includes(next) ?? false;
  }

  isCancellable(): boolean {
    return this.canTransitionTo("cancelled");
  }
}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,  // NULL for guest orders
      references: { model: "users", key: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    isGuest: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    guestName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    guestEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    guestPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null,
    },
    orderStatus: {
      type: DataTypes.ENUM("pending", "confirmed", "processing", "shipped", "delivered", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
    },
    paymentStatus: {
      type: DataTypes.ENUM("unpaid", "paid", "refunded"),
      allowNull: false,
      defaultValue: "unpaid",
    },
    paymentMethod: {
      type: DataTypes.ENUM("cash", "card", "online", "upi"),
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    taxAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discountAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    deliveryAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    deliveryNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    confirmedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    shippedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    cancellationReason: {
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
    modelName: "Order",
    tableName: "orders",
    timestamps: true,
  },
);

// Associations
Order.belongsTo(User, { foreignKey: "customerId", as: "customer" });
User.hasMany(Order,  { foreignKey: "customerId", as: "orders" });

export default Order;
