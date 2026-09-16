import nodemailer from "nodemailer";

/**
 * Reusable nodemailer transporter.
 * Supports Gmail, Outlook, or any SMTP provider.
 *
 * Required env vars:
 *   SMTP_HOST     - e.g. smtp.gmail.com
 *   SMTP_PORT     - e.g. 587
 *   SMTP_USER     - your email address
 *   SMTP_PASS     - app password (not your account password)
 *   SMTP_FROM     - display name + address, e.g. "Rosewood <no-reply@rosewood.com>"
 */

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("[Mailer] SMTP not configured — emails will be skipped.");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,   // true for 465, false for 587/25
    auth: { user, pass },
  });
}

const transporter = createTransporter();

export const FROM = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "Rosewood <no-reply@rosewood.com>";

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  if (!transporter) {
    console.warn("[Mailer] Skipping email — SMTP not configured.");
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    console.log(`[Mailer] Sent to ${opts.to} — messageId: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error("[Mailer] Failed to send email:", err);
    return false;
  }
}
