import { commit, getDb } from "@/lib/db";
import { error, json, requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUSES, type OrderStatus } from "@/types";

/**
 * Admin order updates:
 *   { status }                      change fulfilment status (restocks on cancel)
 *   { carrier, trackingNumber }     update tracking info
 *   { refund: amountInCents, note } process a full or partial refund
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const db = getDb();
  const order = db.orders.find((o) => o.id === params.id);
  if (!order) return error("Order not found.", 404);
  const body = await req.json().catch(() => ({}));
  const now = new Date().toISOString();

  if (body.carrier !== undefined || body.trackingNumber !== undefined) {
    order.carrier = String(body.carrier ?? order.carrier).trim();
    order.trackingNumber = String(body.trackingNumber ?? order.trackingNumber).trim();
  }

  if (body.refund !== undefined) {
    const amount = Math.round(Number(body.refund));
    const remaining = order.total - order.refunded;
    if (!(amount > 0) || amount > remaining) return error(`Refund must be between ₹1 and the remaining ${formatPrice(remaining)}.`);
    order.refunded += amount;
    const full = order.refunded >= order.total;
    if (full) order.status = "refunded";
    order.history.push({
      status: full ? "refunded" : order.status,
      at: now,
      note: `${full ? "Full" : "Partial"} refund of ${formatPrice(amount)}${body.note ? ` — ${String(body.note)}` : ""}`,
    });
  }

  if (body.status && body.status !== order.status) {
    const status = body.status as OrderStatus;
    if (!ORDER_STATUSES.includes(status)) return error("Invalid status.");
    if (["cancelled", "refunded"].includes(order.status)) return error("This order is closed and can't change status.");
    if (status === "cancelled") {
      // Return units to inventory.
      order.items.forEach((i) => {
        const p = db.products.find((x) => x.id === i.productId);
        if (p) {
          p.inventory[i.size] = (p.inventory[i.size] ?? 0) + i.qty;
          p.sold = Math.max(0, p.sold - i.qty);
        }
      });
    }
    order.status = status;
    order.history.push({ status, at: now, note: body.note ? String(body.note) : undefined });
  }

  commit();
  return json({ order });
}
