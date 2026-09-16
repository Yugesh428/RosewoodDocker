import { NextRequest, NextResponse } from "next/server";
import Feedback, { type FeedbackStatus } from "./feedbackModel";
import User from "@/lib/models/userModel";
import { logger } from "@/lib/logger";
import { AppError, errorResponse } from "@/lib/apiError";

const CTX = "FeedbackController";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePagination(sp: URLSearchParams) {
  const page   = Math.max(1, parseInt(sp.get("page")  ?? "1"));
  const limit  = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "20")));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

// ─── GET /api/feedback ────────────────────────────────────────────────────────
// Admin view: ?status, ?page, ?limit

export async function getAllFeedback(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "getAllFeedback — start");

  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = parsePagination(searchParams);

    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    logger.debug(CTX, "getAllFeedback — query", { where, page, limit });

    const { count, rows } = await Feedback.findAndCountAll({
      where,
      include: [{ model: User, as: "customer", attributes: ["id", "name", "email"], required: false }],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    logger.info(CTX, `getAllFeedback — ${rows.length} of ${count}`);

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
    logger.error(CTX, "getAllFeedback — failed", error);
    return errorResponse(error);
  }
}

// ─── GET /api/feedback/:id ────────────────────────────────────────────────────

export async function getFeedbackById(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "getFeedbackById — start", { id });

  try {
    if (!id) throw new AppError("Feedback ID is required.", 400, "MISSING_ID");

    const feedback = await Feedback.findByPk(id, {
      include: [{ model: User, as: "customer", attributes: ["id", "name", "email"], required: false }],
    });

    if (!feedback) {
      logger.warn(CTX, "getFeedbackById — not found", { id });
      throw new AppError("Feedback not found.", 404, "NOT_FOUND");
    }

    logger.info(CTX, "getFeedbackById — found", { id });

    return NextResponse.json({ success: true, data: feedback }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getFeedbackById — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── POST /api/feedback ───────────────────────────────────────────────────────
// Anyone can submit feedback (guests or logged-in customers).
// Body: { customerId?, customerName?, customerEmail?, feedbackText }

export async function createFeedback(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "createFeedback — start");

  try {
    const body = await req.json();
    const { customerId, customerName, customerEmail, feedbackText } = body;

    logger.debug(CTX, "createFeedback — payload", { customerId, customerName, customerEmail });

    if (!feedbackText?.trim()) {
      throw new AppError("feedbackText is required.", 400, "VALIDATION_ERROR");
    }

    // If customerId provided, verify customer exists
    if (customerId) {
      const customer = await User.findByPk(customerId);
      if (!customer) throw new AppError("Customer not found.", 404, "CUSTOMER_NOT_FOUND");
    }

    const feedback = await Feedback.create({
      customerId:    customerId?.trim() || null,
      customerName:  customerName?.trim() || null,
      customerEmail: customerEmail?.trim() || null,
      feedbackText:  feedbackText.trim(),
      status:        "pending",
    });

    logger.info(CTX, "createFeedback — created", { id: feedback.id, customerId });

    return NextResponse.json({ success: true, data: feedback }, { status: 201 });
  } catch (error) {
    logger.error(CTX, "createFeedback — failed", error);
    return errorResponse(error);
  }
}

// ─── PATCH /api/feedback/:id/status ───────────────────────────────────────────
// Admin updates status + adds admin notes.
// Body: { status, adminNotes? }

export async function updateFeedbackStatus(
  req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "updateFeedbackStatus — start", { id });

  try {
    if (!id) throw new AppError("Feedback ID is required.", 400, "MISSING_ID");

    const feedback = await Feedback.findByPk(id);
    if (!feedback) {
      logger.warn(CTX, "updateFeedbackStatus — not found", { id });
      throw new AppError("Feedback not found.", 404, "NOT_FOUND");
    }

    const body = await req.json();
    const { status, adminNotes } = body;

    const VALID_STATUSES: FeedbackStatus[] = ["pending", "reviewed", "resolved"];
    if (status && !VALID_STATUSES.includes(status)) {
      throw new AppError(`status must be one of: ${VALID_STATUSES.join(", ")}.`, 400, "VALIDATION_ERROR");
    }

    logger.debug(CTX, "updateFeedbackStatus — payload", { id, status, adminNotes });

    await feedback.update({
      ...(status     != null && { status }),
      ...(adminNotes != null && { adminNotes: adminNotes?.trim() || null }),
    });

    logger.info(CTX, "updateFeedbackStatus — updated", { id, status: feedback.status });

    return NextResponse.json({ success: true, data: feedback }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "updateFeedbackStatus — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── DELETE /api/feedback/:id ─────────────────────────────────────────────────

export async function deleteFeedback(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "deleteFeedback — start", { id });

  try {
    if (!id) throw new AppError("Feedback ID is required.", 400, "MISSING_ID");

    const feedback = await Feedback.findByPk(id);
    if (!feedback) {
      logger.warn(CTX, "deleteFeedback — not found", { id });
      throw new AppError("Feedback not found.", 404, "NOT_FOUND");
    }

    await feedback.destroy();

    logger.info(CTX, "deleteFeedback — deleted", { id });

    return NextResponse.json({
      success: true,
      message: "Feedback deleted.",
      data: { id },
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "deleteFeedback — failed", { id, error });
    return errorResponse(error);
  }
}
