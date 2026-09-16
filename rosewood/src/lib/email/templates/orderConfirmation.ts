interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number | string;
  lineTotal: number | string;
}

interface OrderEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  isGuest: boolean;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  deliveryAddress: string;
  subtotal: number | string;
  taxAmount: number | string;
  discountAmount: number | string;
  totalAmount: number | string;
  items: OrderItem[];
  createdAt: string | Date;
}

function fmt(n: number | string): string {
  return `£${Number(n).toFixed(2)}`;
}

export function buildOrderConfirmationEmail(order: OrderEmailData): { subject: string; html: string; text: string } {
  const shortId = order.orderId.slice(0, 8).toUpperCase();
  const date = new Date(order.createdAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #F0EDE5;font-size:14px;color:#374151;">${item.productName}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F0EDE5;font-size:14px;color:#374151;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F0EDE5;font-size:14px;color:#374151;text-align:right;">${fmt(item.unitPrice)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F0EDE5;font-size:14px;color:#374151;text-align:right;font-weight:600;">${fmt(item.lineTotal)}</td>
    </tr>
  `).join("");

  const itemsText = order.items.map(i =>
    `  ${i.productName} × ${i.quantity} — ${fmt(i.lineTotal)}`
  ).join("\n");

  const trackSection = order.isGuest
    ? `<p style="margin:0 0 8px;font-size:14px;color:#374151;">
        To track your order, visit 
        <a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/track-order?orderId=${order.orderId}&amp;email=${encodeURIComponent(order.customerEmail)}"
           style="color:#D4AF37;text-decoration:underline;">Track Order</a>
        and enter your Order ID and email address.
      </p>`
    : `<p style="margin:0 0 8px;font-size:14px;color:#374151;">
        View your order history in 
        <a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/account/orders"
           style="color:#D4AF37;text-decoration:underline;">My Orders</a>.
      </p>`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmation — Rosewood</title>
</head>
<body style="margin:0;padding:0;background:#F9F9F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F9F9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#1A1A1A;padding:32px 40px;text-align:center;border-radius:8px 8px 0 0;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#D4AF37;">Rosewood Pharmacy</p>
              <h1 style="margin:0;font-size:24px;color:#ffffff;font-weight:600;">Order Confirmed</h1>
            </td>
          </tr>

          <!-- Success banner -->
          <tr>
            <td style="background:#D4AF37;padding:16px 40px;text-align:center;">
              <p style="margin:0;font-size:15px;color:#000000;font-weight:600;">
                ✓ &nbsp;Thank you, ${order.customerName}! Your order has been placed.
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:32px 40px;border-left:1px solid #E8E4DC;border-right:1px solid #E8E4DC;">

              <!-- Order meta -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="width:50%;padding-right:12px;">
                    <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#9CA3AF;">Order ID</p>
                    <p style="margin:0;font-size:13px;font-family:monospace;font-weight:700;color:#1A1A1A;word-break:break-all;">${order.orderId}</p>
                  </td>
                  <td style="width:50%;padding-left:12px;">
                    <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#9CA3AF;">Order Date</p>
                    <p style="margin:0;font-size:13px;color:#1A1A1A;font-weight:600;">${date}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px;padding-right:12px;">
                    <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#9CA3AF;">Payment Method</p>
                    <p style="margin:0;font-size:13px;color:#1A1A1A;font-weight:600;text-transform:capitalize;">${order.paymentMethod}</p>
                  </td>
                  <td style="padding-top:16px;padding-left:12px;">
                    <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#9CA3AF;">Payment Status</p>
                    <p style="margin:0;font-size:13px;font-weight:700;color:${order.paymentStatus === "paid" ? "#16a34a" : "#dc2626"};">
                      ${order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #F0EDE5;margin:0 0 24px;" />

              <!-- Items table -->
              <h2 style="margin:0 0 16px;font-size:16px;color:#1A1A1A;font-weight:600;">Order Items</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #F0EDE5;border-radius:6px;overflow:hidden;margin-bottom:24px;">
                <thead>
                  <tr style="background:#F9F9F9;">
                    <th style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#9CA3AF;text-align:left;font-weight:600;">Product</th>
                    <th style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#9CA3AF;text-align:center;font-weight:600;">Qty</th>
                    <th style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#9CA3AF;text-align:right;font-weight:600;">Unit Price</th>
                    <th style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#9CA3AF;text-align:right;font-weight:600;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Totals -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#6B6B6B;">Subtotal</td>
                  <td style="padding:6px 0;font-size:14px;color:#1A1A1A;font-weight:500;text-align:right;">${fmt(order.subtotal)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#6B6B6B;">Tax</td>
                  <td style="padding:6px 0;font-size:14px;color:#1A1A1A;font-weight:500;text-align:right;">${fmt(order.taxAmount)}</td>
                </tr>
                ${Number(order.discountAmount) > 0 ? `
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#6B6B6B;">Discount</td>
                  <td style="padding:6px 0;font-size:14px;color:#16a34a;font-weight:500;text-align:right;">-${fmt(order.discountAmount)}</td>
                </tr>` : ""}
                <tr>
                  <td style="padding:12px 0 6px;font-size:16px;color:#1A1A1A;font-weight:700;border-top:2px solid #F0EDE5;">Total</td>
                  <td style="padding:12px 0 6px;font-size:18px;color:#D4AF37;font-weight:700;text-align:right;border-top:2px solid #F0EDE5;">${fmt(order.totalAmount)}</td>
                </tr>
              </table>

              <!-- Delivery address -->
              <hr style="border:none;border-top:1px solid #F0EDE5;margin:0 0 24px;" />
              <h2 style="margin:0 0 10px;font-size:16px;color:#1A1A1A;font-weight:600;">Delivery Address</h2>
              <p style="margin:0 0 24px;font-size:14px;color:#374151;white-space:pre-line;">${order.deliveryAddress}</p>

              <!-- Track order -->
              <hr style="border:none;border-top:1px solid #F0EDE5;margin:0 0 24px;" />
              <h2 style="margin:0 0 10px;font-size:16px;color:#1A1A1A;font-weight:600;">Track Your Order</h2>
              ${trackSection}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F9F9F9;padding:24px 40px;text-align:center;border:1px solid #E8E4DC;border-top:none;border-radius:0 0 8px 8px;">
              <p style="margin:0 0 6px;font-size:12px;color:#9CA3AF;">Questions? Email us at <a href="mailto:support@rosewood.com" style="color:#D4AF37;">support@rosewood.com</a></p>
              <p style="margin:0;font-size:11px;color:#C4C0B8;">© ${new Date().getFullYear()} Rosewood Pharmacy. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
ORDER CONFIRMED — Rosewood Pharmacy
====================================
Thank you, ${order.customerName}!

Order ID:   ${order.orderId}
Short ID:   #${shortId}
Date:       ${date}
Payment:    ${order.paymentMethod} — ${order.paymentStatus}

ITEMS
-----
${itemsText}

Subtotal:   ${fmt(order.subtotal)}
Tax:        ${fmt(order.taxAmount)}
${Number(order.discountAmount) > 0 ? `Discount:   -${fmt(order.discountAmount)}\n` : ""}Total:      ${fmt(order.totalAmount)}

DELIVERY ADDRESS
----------------
${order.deliveryAddress}

Track your order at:
${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/track-order?orderId=${order.orderId}&email=${encodeURIComponent(order.customerEmail)}

— Rosewood Pharmacy Support: support@rosewood.com
  `.trim();

  return {
    subject: `Order Confirmed #${shortId} — Rosewood Pharmacy`,
    html,
    text,
  };
}
