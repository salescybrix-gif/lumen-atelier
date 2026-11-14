import { commit, getDb } from "@/lib/db";
import { error, getSession, json, requireUser } from "@/lib/auth";
import { cardBrand, DELIVERY_METHODS, FREE_SHIPPING_THRESHOLD, luhn, maskUpiId, STANDARD_SHIPPING_FEE, UPI_ID_RE, TAX_RATE, uid } from "@/lib/utils";
import type { Order, OrderItem } from "@/types";

export const dynamic = "force-dynamic";

/** Current user's order history. */
export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const orders = getDb().orders.filter((o) => o.userId === auth.ctx.user.id);
  return json({ orders });
}

/**
 * Places an order. Prices and stock are always re-validated server-side;
 * the client-supplied cart only provides product ids, variants and quantities.
 * The payment step is a mock gateway: 4000 0000 0000 0002 is always declined.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return error("Invalid request.");
  const ctx = await getSession();
  const db = getDb();

  const { items, email, shippingAddress, deliveryId, payment } = body as {
    items: { productId: string; size: string; color: string; qty: number }[];
    email: string;
    shippingAddress: Order["shippingAddress"];
    deliveryId: string;
    payment: { method?: "card" | "upi"; number?: string; exp?: string; cvc?: string; name?: string; savedId?: string; upiId?: string; qr?: boolean };
  };

  if (!Array.isArray(items) || items.length === 0) return error("Your bag is empty.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? ""))) return error("Please enter a valid email.");
  const a = shippingAddress ?? ({} as Order["shippingAddress"]);
  if (![a.fullName, a.line1, a.city, a.region, a.postalCode, a.country].every((v) => String(v ?? "").trim())) {
    return error("Please complete your shipping address.");
  }
  if (a.country === "India" && !/^[1-9]\d{5}$/.test(String(a.postalCode).trim())) return error("Please enter a valid 6-digit PIN code.");
  const delivery = DELIVERY_METHODS.find((d) => d.id === deliveryId);
  if (!delivery) return error("Please choose a delivery method.");

  // ---- Mock payment gateway ----
  let paid: Order["payment"];
  if (payment?.method === "upi") {
    // Mock UPI collect request: any well-formed UPI ID is approved, except fail@upi which is declined.
    if (payment.qr) {
      paid = { method: "upi", brand: "UPI", last4: "", upiId: "QR scan" };
    } else {
    const upiId = String(payment.upiId ?? "").trim().toLowerCase();
    if (!UPI_ID_RE.test(upiId)) return error("Please enter a valid UPI ID, e.g. name@okhdfcbank.", 402);
    if (upiId === "fail@upi") return error("The UPI payment was declined in your UPI app. Please try again.", 402);
    paid = { method: "upi", brand: "UPI", last4: "", upiId: maskUpiId(upiId) };
    }
  } else if (payment?.savedId) {
    const pm = ctx?.user.paymentMethods.find((p) => p.id === payment.savedId);
    if (!pm) return error("Saved payment method not found.");
    paid = { method: "card", brand: pm.brand, last4: pm.last4 };
  } else {
    const number = String(payment?.number ?? "").replace(/\s/g, "");
    if (!luhn(number)) return error("Your card number is invalid.", 402);
    const [mm, yy] = String(payment?.exp ?? "").split("/").map((s) => Number(s.trim()));
    const expDate = new Date(2000 + yy, mm, 0, 23, 59);
    if (!mm || mm > 12 || !yy || expDate < new Date()) return error("Your card has expired or the date is invalid.", 402);
    if (!/^\d{3,4}$/.test(String(payment?.cvc ?? ""))) return error("Your security code is invalid.", 402);
    if (number === "4000000000000002") return error("Your card was declined. Try a different card.", 402);
    paid = { method: "card", brand: cardBrand(number), last4: number.slice(-4) };
  }

  // ---- Validate items against inventory ----
  const lines: OrderItem[] = [];
  for (const it of items) {
    const p = db.products.find((x) => x.id === it.productId && x.status === "active");
    if (!p) return error("An item in your bag is no longer available.", 409);
    const qty = Math.max(1, Math.floor(Number(it.qty)));
    const available = p.inventory[it.size] ?? 0;
    if (available < qty) return error(`Only ${available} left of ${p.title} (${it.size}).`, 409);
    lines.push({
      productId: p.id,
      slug: p.slug,
      title: p.title,
      image: p.images[0],
      category: p.category,
      size: it.size,
      color: it.color,
      price: p.price,
      qty,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const shipping = delivery.id === "standard" && subtotal < FREE_SHIPPING_THRESHOLD ? STANDARD_SHIPPING_FEE : delivery.price;
  const tax = Math.round(subtotal * TAX_RATE);
  const now = new Date().toISOString();

  // Commit stock changes only after every line validated.
  lines.forEach((l) => {
    const p = db.products.find((x) => x.id === l.productId)!;
    p.inventory[l.size] -= l.qty;
    p.sold += l.qty;
  });

  const order: Order = {
    id: uid("ord"),
    number: `LM-${Date.now().toString().slice(-7)}`,
    userId: ctx?.user.id,
    email: String(email).toLowerCase(),
    customerName: a.fullName,
    items: lines,
    shippingAddress: a,
    delivery,
    payment: paid,
    subtotal,
    shipping,
    tax,
    total: subtotal + shipping + tax,
    refunded: 0,
    status: "pending",
    carrier: "Delhivery",
    trackingNumber: `DLV${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}IN`,
    history: [{ status: "pending", at: now, note: "Order placed" }],
    createdAt: now,
  };
  db.orders.unshift(order);

  const today = now.slice(0, 10);
  db.visits[today] = (db.visits[today] ?? 0) + 1;
  commit();
  return json({ order }, 201);
}
