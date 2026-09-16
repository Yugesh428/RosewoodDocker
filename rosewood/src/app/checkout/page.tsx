"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ShoppingBag, CreditCard, MapPin, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import ProductImage from "@/components/ui/ProductImage";
import Link from "next/link";

export default function CheckoutPage() {
  const { data: session, status: sessionStatus } = useSession();
  const { items, totalPrice, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "online" | "upi">("cash");

  const [guestName,    setGuestName]    = useState("");
  const [guestEmail,   setGuestEmail]   = useState("");
  const [guestPhone,   setGuestPhone]   = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNotes,   setDeliveryNotes]   = useState("");

  const isGuest = sessionStatus === "unauthenticated";
  const isAuthenticated = sessionStatus === "authenticated" && !!session?.user;

  // ── loading skeleton ──────────────────────────────────────────────────────
  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  // ── empty cart ────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-heading text-[#1A1A1A] mb-4">Your cart is empty</p>
          <Link
            href="/pharmacy"
            className="inline-block px-6 py-2.5 bg-[#D4AF37] text-white font-semibold rounded-md hover:bg-[#b8952e] transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = totalPrice;
  const tax      = subtotal * 0.1;
  const total    = subtotal + tax;

  // ── submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isGuest) {
      if (!guestName.trim())  { toast.error("Please enter your name");         return; }
      if (!guestEmail.trim()) { toast.error("Please enter your email");        return; }
      if (!guestPhone.trim()) { toast.error("Please enter your phone number"); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
        toast.error("Please enter a valid email address"); return;
      }
    }
    if (!deliveryAddress.trim()) { toast.error("Please enter your delivery address"); return; }

    setLoading(true);
    const toastId = toast.loading("Processing your order...");

    try {
      // ── Resolve inventory IDs ──────────────────────────────────────────────
      const orderItems = await Promise.all(
        items.map(async (item) => {
          let inventoryId = item.inventoryId;
          if (!inventoryId) {
            const r = await fetch(`/api/inventory?productId=${item.id}&isActive=true&limit=1`);
            const j = await r.json();
            if (j.success && j.data?.length > 0) {
              inventoryId = j.data[0].id as string;
            } else {
              throw new Error(`No inventory available for "${item.name}"`);
            }
          }
          return { productId: item.id, inventoryId, quantity: item.quantity };
        })
      );

      // ── Build payload ─────────────────────────────────────────────────────
      const payload = isGuest
        ? {
            isGuest: true,
            guestName:  guestName.trim(),
            guestEmail: guestEmail.trim().toLowerCase(),
            guestPhone: guestPhone.trim(),
            paymentMethod,
            deliveryAddress: deliveryAddress.trim(),
            deliveryNotes: deliveryNotes.trim() || undefined,
            items: orderItems,
          }
        : {
            isGuest: false,
            customerId: (session!.user as { id: string }).id,
            paymentMethod,
            deliveryAddress: deliveryAddress.trim(),
            deliveryNotes: deliveryNotes.trim() || undefined,
            items: orderItems,
          };

      // ── Create order ──────────────────────────────────────────────────────
      const res  = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || json.message || "Order creation failed");

      // ── Mark as paid (mock) ───────────────────────────────────────────────
      await fetch(`/api/orders/${json.data.id}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "paid" }),
      });

      const orderId = json.data.id as string;
      const shortId = orderId.slice(0, 8).toUpperCase();

      // ── Save success flag for confirmation page ───────────────────────────
      try {
        sessionStorage.setItem("orderSuccess", JSON.stringify({ orderId, shortId, ts: Date.now() }));
      } catch { /* ignore */ }

      // ── Update toast then clear cart and navigate ─────────────────────────
      toast.success(`Order #${shortId} placed!`, {
        id: toastId,
        description: "Redirecting to confirmation...",
        duration: 3000,
      });

      // Clear cart AFTER saving state — use a small delay so the toast renders
      setTimeout(() => {
        clearCart();
        const email = isGuest ? encodeURIComponent(guestEmail) : "";
        window.location.href = `/order-confirmation/${orderId}?email=${email}&new=1`;
      }, 600);

    } catch (err) {
      console.error("Checkout error:", err);
      toast.error(err instanceof Error ? err.message : "Something went wrong", { id: toastId });
      setLoading(false);
    }
    // Note: setLoading(false) intentionally NOT called on success — the page navigates away
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F9F9F9] py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-heading text-[#1A1A1A] mb-2">Checkout</h1>
          <p className="text-sm text-[#6B6B6B]">Complete your order</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── Left column ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Guest details */}
              {isGuest && (
                <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
                    <h2 className="text-lg font-heading text-[#1A1A1A]">Your Details</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text" value={guestName}
                        onChange={e => setGuestName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email" value={guestEmail}
                        onChange={e => setGuestEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                        required
                      />
                      <p className="text-xs text-[#6B6B6B] mt-1">Save this email — you&apos;ll need it to track your order</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel" value={guestPhone}
                        onChange={e => setGuestPhone(e.target.value)}
                        placeholder="+44 123 456 7890"
                        className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Logged-in user info */}
              {isAuthenticated && (
                <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
                    <h2 className="text-lg font-heading text-[#1A1A1A]">Your Details</h2>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-[#6B6B6B]">Name:</span>{" "}<span className="font-medium">{session!.user.name}</span></p>
                    <p><span className="text-[#6B6B6B]">Email:</span>{" "}<span className="font-medium">{session!.user.email}</span></p>
                  </div>
                </div>
              )}

              {/* Delivery address */}
              <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-[#D4AF37]" />
                  <h2 className="text-lg font-heading text-[#1A1A1A]">Delivery Address</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      placeholder="Street address, city, postal code"
                      rows={3}
                      className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent resize-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                      Delivery Notes (Optional)
                    </label>
                    <textarea
                      value={deliveryNotes}
                      onChange={e => setDeliveryNotes(e.target.value)}
                      placeholder="Any special instructions..."
                      rows={2}
                      className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment method */}
              <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-[#D4AF37]" />
                  <h2 className="text-lg font-heading text-[#1A1A1A]">Payment Method</h2>
                </div>
                <div className="space-y-3">
                  {([
                    { value: "cash",   label: "Cash on Delivery" },
                    { value: "card",   label: "Card Payment" },
                    { value: "online", label: "Online Banking" },
                    { value: "upi",    label: "UPI" },
                  ] as const).map(m => (
                    <label
                      key={m.value}
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === m.value
                          ? "border-[#D4AF37] bg-[#FEF9EC]"
                          : "border-[#E5E5E5] hover:border-[#D4AF37]/50"
                      }`}
                    >
                      <input
                        type="radio" value={m.value}
                        checked={paymentMethod === m.value}
                        onChange={() => setPaymentMethod(m.value)}
                        className="w-4 h-4 accent-[#D4AF37]"
                      />
                      <span className="text-sm font-medium text-[#1A1A1A]">{m.label}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-[#6B6B6B] mt-4 italic">
                  Demo mode — payment is instantly approved.
                </p>
              </div>
            </div>

            {/* ── Right column — Order summary ── */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-[#E5E5E5] p-6 sticky top-4">
                <h2 className="text-lg font-heading text-[#1A1A1A] mb-4">Order Summary</h2>

                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative w-16 h-16 flex-shrink-0 bg-[#F9F9F9] rounded border border-[#E5E5E5] overflow-hidden">
                        <ProductImage src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1A1A1A] line-clamp-2">{item.name}</p>
                        <p className="text-xs text-[#6B6B6B] mt-0.5">Qty: {item.quantity}</p>
                        <p className="text-sm font-semibold text-[#1A1A1A] mt-1">
                          £{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#E5E5E5] pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B6B6B]">Subtotal</span>
                    <span className="font-medium">£{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B6B6B]">Tax (est.)</span>
                    <span className="font-medium">£{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-[#E5E5E5]">
                    <span>Total</span>
                    <span className="text-[#D4AF37]">£{total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 py-3 bg-[#D4AF37] text-white font-semibold rounded-md hover:bg-[#b8952e] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                    : "Place Order"}
                </button>

                <p className="text-xs text-center text-[#6B6B6B] mt-3">
                  By placing this order you agree to our terms
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
