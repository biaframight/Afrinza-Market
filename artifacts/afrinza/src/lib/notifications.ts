// ─── Afrinza Notification Helpers ──────────────────────────────────────────
// Telegram: set VITE_TELEGRAM_BOT_TOKEN and VITE_TELEGRAM_CHAT_ID in .env
// Email:    alphuplift@gmail.com is notified via Telegram + WhatsApp

const TELEGRAM_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN as string | undefined;
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID as string | undefined;

export async function sendTelegramNotification(message: string): Promise<void> {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    });
  } catch (err) {
    console.error("[Afrinza] Telegram notification failed:", err);
  }
}

export function buildOrderNotificationMessage(params: {
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  deliveryMethod: string;
  paymentMethod: string;
  items: { title: string; qty: number; price: string }[];
  total: string;
}): string {
  const itemLines = params.items.map((it) => `• ${it.title} x${it.qty} — RM ${it.price}`).join("\n");
  return [
    `🛒 *New Order — Afrinza Marketplace*`,
    ``,
    `👤 *Buyer:* ${params.buyerName}`,
    `📱 *Phone:* ${params.buyerPhone}`,
    `📍 *Address:* ${params.buyerAddress}`,
    `🚚 *Delivery:* ${params.deliveryMethod}`,
    `💳 *Payment:* ${params.paymentMethod}`,
    ``,
    `*Items:*`,
    itemLines,
    ``,
    `💰 *Total: RM ${params.total}*`,
  ].join("\n");
}
