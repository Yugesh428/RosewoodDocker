import { NextRequest, NextResponse } from "next/server";
import { Op } from "sequelize";
import User from "@/lib/models/userModel";
import Order from "../orders/orderModel";
import { logger } from "@/lib/logger";
import { AppError, errorResponse } from "@/lib/apiError";

const CTX = "CustomerController";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Never expose password in any response
const SAFE_ATTRIBUTES = ["id", "name", "email", "isActive", "createdAt", "updatedAt"];

function parsePagination(sp: URLSearchParams) {
  const page   = Math.max(1, parseInt(sp.get("page")  ?? "1"));
  const limit  = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "20")));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

// ─── GET /api/customers ───────────────────────────────────────────────────────
// ?isActive, ?search (name / email), ?page, ?limit

export async function getAllCustomers(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "getAllCustomers — start");

  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = parsePagination(searchParams);

    const isActiveParam = searchParams.get("isActive");
    const search        = searchParams.get("search");

    const where: Record<string, unknown> = { role: "CUSTOMER" };
    if (isActiveParam !== null) where.isActive = isActiveParam === "true";

    if (search) {
      where[Op.or as unknown as string] = [
        { name:  { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    logger.debug(CTX, "getAllCustomers — query", { where, page, limit });

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: SAFE_ATTRIBUTES,
      order: [["name", "ASC"]],
      limit,
      offset,
    });

    logger.info(CTX, `getAllCustomers — ${rows.length} of ${count}`);

    return NextResponse.json({
      success: true,
      pagination: {
        total:   count,
        page,
        limit,
        pages:   Math.ceil(count / limit),
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1,
      },
      data: rows,
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getAllCustomers — failed", error);
    return errorResponse(error);
  }
}

// ─── GET /api/customers/:id ───────────────────────────────────────────────────

export async function getCustomerById(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "getCustomerById — start", { id });

  try {
    if (!id) throw new AppError("Customer ID is required.", 400, "MISSING_ID");

    const customer = await User.findOne({
      where: { id, role: "CUSTOMER" },
      attributes: SAFE_ATTRIBUTES,
    });

    if (!customer) {
      logger.warn(CTX, "getCustomerById — not found", { id });
      throw new AppError("Customer not found.", 404, "NOT_FOUND");
    }

    logger.info(CTX, "getCustomerById — found", { id, name: customer.name });
    return NextResponse.json({ success: true, data: customer }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getCustomerById — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── GET /api/customers/:id/orders ───────────────────────────────────────────
// Customer profile with their order history summary

export async function getCustomerWithOrders(
  req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "getCustomerWithOrders — start", { id });

  try {
    if (!id) throw new AppError("Customer ID is required.", 400, "MISSING_ID");

    const customer = await User.findOne({
      where: { id, role: "CUSTOMER" },
      attributes: SAFE_ATTRIBUTES,
    });

    if (!customer) {
      logger.warn(CTX, "getCustomerWithOrders — not found", { id });
      throw new AppError("Customer not found.", 404, "NOT_FOUND");
    }

    const { searchParams } = new URL(req.url);
    const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
    const limit  = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10")));
    const offset = (page - 1) * limit;

    const { count, rows: orders } = await Order.findAndCountAll({
      where: { customerId: id },
      attributes: ["id", "orderStatus", "paymentStatus", "totalAmount", "createdAt"],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    // Quick stats
    const allOrders = await Order.findAll({
      where: { customerId: id },
      attributes: ["orderStatus", "paymentStatus", "totalAmount"],
      raw: true,
    }) as unknown as Array<{ orderStatus: string; paymentStatus: string; totalAmount: string }>;

    const totalSpent = allOrders
      .filter((o) => o.orderStatus === "delivered" && o.paymentStatus === "paid")
      .reduce((s, o) => s + parseFloat(o.totalAmount ?? "0"), 0);

    logger.info(CTX, "getCustomerWithOrders — done", { id, orderCount: count });

    return NextResponse.json({
      success: true,
      data: {
        customer,
        stats: {
          totalOrders:     count,
          totalSpent:      parseFloat(totalSpent.toFixed(2)),
          pendingOrders:   allOrders.filter((o) => o.orderStatus === "pending").length,
          cancelledOrders: allOrders.filter((o) => o.orderStatus === "cancelled").length,
        },
        orders: {
          pagination: {
            total:   count,
            page,
            limit,
            pages:   Math.ceil(count / limit),
            hasNext: page < Math.ceil(count / limit),
            hasPrev: page > 1,
          },
          data: orders,
        },
      },
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getCustomerWithOrders — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── PUT /api/customers/:id ───────────────────────────────────────────────────
// Admin can update name and email only. Password changes go through auth flow.

export async function updateCustomer(
  req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "updateCustomer — start", { id });

  try {
    if (!id) throw new AppError("Customer ID is required.", 400, "MISSING_ID");

    const customer = await User.findOne({ where: { id, role: "CUSTOMER" } });
    if (!customer) {
      logger.warn(CTX, "updateCustomer — not found", { id });
      throw new AppError("Customer not found.", 404, "NOT_FOUND");
    }

    const body = await req.json();
    const { name, email } = body;

    logger.debug(CTX, "updateCustomer — payload", { id, name, email });

    // If changing email, check no duplicate
    if (email && email.trim().toLowerCase() !== customer.email) {
      const dup = await User.findOne({
        where: {
          email: email.trim().toLowerCase(),
          id: { [Op.ne]: id },
        },
      });
      if (dup) {
        throw new AppError(
          `Email "${email}" is already registered to another account.`,
          409, "DUPLICATE_EMAIL",
        );
      }
    }

    await customer.update({
      ...(name  != null && { name:  name.trim() }),
      ...(email != null && { email: email.trim().toLowerCase() }),
    });

    logger.info(CTX, "updateCustomer — updated", { id, name: customer.name });

    return NextResponse.json({
      success: true,
      data: {
        id:        customer.id,
        name:      customer.name,
        email:     customer.email,
        isActive:  customer.isActive,
        updatedAt: customer.updatedAt,
      },
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "updateCustomer — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── PATCH /api/customers/:id/toggle-active ───────────────────────────────────
// Activate or deactivate a customer account.
// Deactivated customers cannot log in (handled in auth layer).

export async function toggleCustomerActive(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "toggleCustomerActive — start", { id });

  try {
    if (!id) throw new AppError("Customer ID is required.", 400, "MISSING_ID");

    const customer = await User.findOne({ where: { id, role: "CUSTOMER" } });
    if (!customer) {
      logger.warn(CTX, "toggleCustomerActive — not found", { id });
      throw new AppError("Customer not found.", 404, "NOT_FOUND");
    }

    const previous = customer.isActive;
    await customer.update({ isActive: !previous });

    logger.info(CTX, "toggleCustomerActive — toggled", {
      id, name: customer.name, from: previous, to: customer.isActive,
    });

    return NextResponse.json({
      success: true,
      message: `Account for "${customer.name}" is now ${customer.isActive ? "active" : "inactive"}.`,
      data: {
        id:       customer.id,
        name:     customer.name,
        email:    customer.email,
        isActive: customer.isActive,
      },
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "toggleCustomerActive — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── GET /api/customers/stats ─────────────────────────────────────────────────
// Quick admin dashboard numbers for customers

export async function getCustomerStats(_req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "getCustomerStats — start");

  try {
    const [total, active, inactive] = await Promise.all([
      User.count({ where: { role: "CUSTOMER" } }),
      User.count({ where: { role: "CUSTOMER", isActive: true  } }),
      User.count({ where: { role: "CUSTOMER", isActive: false } }),
    ]);

    logger.info(CTX, "getCustomerStats — done", { total, active, inactive });

    return NextResponse.json({
      success: true,
      data: { total, active, inactive },
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getCustomerStats — failed", error);
    return errorResponse(error);
  }
}
