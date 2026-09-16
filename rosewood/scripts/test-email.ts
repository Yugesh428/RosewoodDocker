import { sendMail } from "../src/lib/email/mailer";

(async () => {
  console.log("📧 Testing SMTP connection...");
  console.log(`   Host: ${process.env.SMTP_HOST}`);
  console.log(`   User: ${process.env.SMTP_USER}`);

  const ok = await sendMail({
    to: process.env.SMTP_USER!,
    subject: "Rosewood — SMTP Test ✓",
    html: `<h2>SMTP is working!</h2><p>Sent at ${new Date().toISOString()}</p>`,
    text: `SMTP is working! Sent at ${new Date().toISOString()}`,
  });

  if (ok) {
    console.log("✅ Email sent successfully — check your inbox.");
  } else {
    console.error("❌ Email failed — check SMTP credentials.");
  }

  process.exit(0);
})();
