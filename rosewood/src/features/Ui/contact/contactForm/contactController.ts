import { NextRequest, NextResponse } from "next/server";
import ContactMessage from "./contactFormModel";
import { logger } from "@/lib/logger";
import { AppError, errorResponse } from "@/lib/apiError";

const CTX = "ContactController";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── GET /api/ui/contact ──────────────────────────────────────────────────────
// Admin: list all messages, newest first
// Query: ?read=true|false  (optional filter)

export async function getMessages(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "getMessages — start");

  try {
    const isReadParam = new URL(req.url).searchParams.get("read");
    const where: Record<string, unknown> = {};
    if (isReadParam !== null) where.isRead = isReadParam === "true";

    const messages = await ContactMessage.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    logger.info(CTX, `getMessages — ${messages.length} messages`);
    return NextResponse.json({ success: true, data: messages }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getMessages — failed", error);
    return errorResponse(error);
  }
}

// ─── GET /api/ui/contact/:id ──────────────────────────────────────────────────
// Admin: get a single message by ID

export async function getMessage(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "getMessage — start", { id });

  try {
    if (!id) throw new AppError("Message ID is required.", 400, "MISSING_ID");

    const message = await ContactMessage.findByPk(id);
    if (!message) {
      logger.warn(CTX, "getMessage — not found", { id });
      throw new AppError("Message not found.", 404, "NOT_FOUND");
    }

    return NextResponse.json({ success: true, data: message }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getMessage — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── POST /api/ui/contact ─────────────────────────────────────────────────────
// Public: submit a contact message
// Body: { fullName, email, phone?, message }

export async function createMessage(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "createMessage — start");

  try {
    const body = await req.json() as Record<string, string>;
    const { fullName, email, phone, message } = body;

    if (!fullName?.trim())
      throw new AppError("fullName is required.", 400, "MISSING_NAME");
    if (!email?.trim())
      throw new AppError("email is required.", 400, "MISSING_EMAIL");
    if (!EMAIL_REGEX.test(email.trim()))
      throw new AppError("Invalid email address.", 400, "INVALID_EMAIL");
    if (!message?.trim())
      throw new AppError("message is required.", 400, "MISSING_MESSAGE");

    const contact = await ContactMessage.create({
      fullName: fullName.trim(),
      email:    email.trim().toLowerCase(),
      phone:    phone?.trim() || null,
      message:  message.trim(),
      isRead:   false,
    });

    logger.info(CTX, "createMessage — created", { id: contact.id });

    return NextResponse.json(
      { success: true, message: "Message sent successfully.", data: { id: contact.id } },
      { status: 201 },
    );
  } catch (error) {
    logger.error(CTX, "createMessage — failed", error);
    return errorResponse(error);
  }
}

// ─── PATCH /api/ui/contact/:id/read ──────────────────────────────────────────
// Admin: toggle isRead true ↔ false

export async function toggleRead(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "toggleRead — start", { id });

  try {
    if (!id) throw new AppError("Message ID is required.", 400, "MISSING_ID");

    const message = await ContactMessage.findByPk(id);
    if (!message) {
      logger.warn(CTX, "toggleRead — not found", { id });
      throw new AppError("Message not found.", 404, "NOT_FOUND");
    }

    await message.update({ isRead: !message.isRead });

    logger.info(CTX, "toggleRead — toggled", { id, isRead: message.isRead });

    return NextResponse.json(
      {
        success: true,
        message: `Message marked as ${message.isRead ? "read" : "unread"}.`,
        data: { id: message.id, isRead: message.isRead },
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error(CTX, "toggleRead — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── DELETE /api/ui/contact/:id ───────────────────────────────────────────────
// Admin: delete a message

export async function deleteMessage(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "deleteMessage — start", { id });

  try {
    if (!id) throw new AppError("Message ID is required.", 400, "MISSING_ID");

    const message = await ContactMessage.findByPk(id);
    if (!message) {
      logger.warn(CTX, "deleteMessage — not found", { id });
      throw new AppError("Message not found.", 404, "NOT_FOUND");
    }

    await message.destroy();

    logger.info(CTX, "deleteMessage — deleted", { id });
    return NextResponse.json(
      { success: true, message: "Message deleted." },
      { status: 200 },
    );
  } catch (error) {
    logger.error(CTX, "deleteMessage — failed", { id, error });
    return errorResponse(error);
  }
}
