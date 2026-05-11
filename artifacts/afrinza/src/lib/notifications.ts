// ─── Afrinza Notification Helpers ──────────────────────────────────────────
// Email: uses EmailJS (free, browser-based, no backend needed)
// Set these in artifacts/afrinza/.env:
//   VITE_EMAILJS_SERVICE_ID   — from emailjs.com → Email Services
//   VITE_EMAILJS_TEMPLATE_ID  — from emailjs.com → Email Templates
//   VITE_EMAILJS_PUBLIC_KEY   — from emailjs.com → Account → Public Key

const EMAILJS_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined;

const ADMIN_EMAIL = "alphuplift@gmail.com";

export async function sendOrderEmailNotification(params: {
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  deliveryMethod: string;
  paymentMethod: string;
  items: { title: string; qty: number; price: string }[];
  total: string;
}): Promise<void> {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) return;

  const itemLines = params.items
    .map((it) => `• ${it.title} x${it.qty} — RM ${it.price}`)
    .join("\n");

  try {
    await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: ADMIN_EMAIL,
          subject: `New Order — Afrinza Marketplace`,
          buyer_name: params.buyerName,
          buyer_phone: params.buyerPhone,
          buyer_address: params.buyerAddress,
          delivery_method: params.deliveryMethod,
          payment_method: params.paymentMethod,
          items: itemLines,
          total: `RM ${params.total}`,
        },
      }),
    });
  } catch (err) {
    console.error("[Afrinza] Email notification failed:", err);
  }
}
