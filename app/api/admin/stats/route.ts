import { getDb } from "@/lib/db";
import { json, requireAdmin } from "@/lib/auth";
import type { Order } from "@/types";

export const dynamic = "force-dynamic";

const DAY = 86400000;
const counts = (o: Order) => o.status !== "cancelled" && o.status !== "refunded";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const range = (new URL(req.url).searchParams.get("range") ?? "month") as "week" | "month" | "year";
  const db = getDb();
  const now = new Date();
  const days = range === "week" ? 7 : range === "month" ? 30 : 365;
  const start = new Date(now.getTime() - days * DAY);
  const prevStart = new Date(start.getTime() - days * DAY);

  const inRange = (o: Order, from: Date, to: Date) => {
    const t = new Date(o.createdAt);
    return t >= from && t < to;
  };
  const current = db.orders.filter((o) => inRange(o, start, now));
  const previous = db.orders.filter((o) => inRange(o, prevStart, start));

  const revenue = (list: Order[]) => list.filter(counts).reduce((s, o) => s + o.total - o.refunded, 0);
  const visitsBetween = (from: Date, to: Date) =>
    Object.entries(db.visits)
      .filter(([d]) => {
        const t = new Date(d + "T12:00:00Z");
        return t >= from && t < to;
      })
      .reduce((s, [, v]) => s + v, 0);

  const activeUsers = (from: Date, to: Date) =>
    new Set(db.orders.filter((o) => inRange(o, from, to) && o.userId).map((o) => o.userId)).size;

  const conv = (list: Order[], from: Date, to: Date) => {
    const v = visitsBetween(from, to);
    return v ? (list.length / v) * 100 : 0;
  };
  // null = no data in the previous period to compare against.
  const delta = (a: number, b: number) => (b ? ((a - b) / b) * 100 : null);

  const kpis = {
    revenue: { value: revenue(current), delta: delta(revenue(current), revenue(previous)) },
    orders: { value: current.length, delta: delta(current.length, previous.length) },
    activeUsers: { value: activeUsers(start, now), delta: delta(activeUsers(start, now), activeUsers(prevStart, start)) },
    conversion: { value: conv(current, start, now), delta: previous.length ? conv(current, start, now) - conv(previous, prevStart, start) : null },
  };

  // Time series: daily buckets for week/month, monthly buckets for year.
  const series: { label: string; revenue: number; orders: number }[] = [];
  if (range === "year") {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const list = db.orders.filter((o) => inRange(o, d, next));
      series.push({ label: d.toLocaleDateString("en-IN", { month: "short" }), revenue: revenue(list), orders: list.length });
    }
  } else {
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const next = new Date(d.getTime() + DAY);
      const list = db.orders.filter((o) => inRange(o, d, next));
      series.push({
        label: d.toLocaleDateString("en-IN", range === "week" ? { weekday: "short" } : { month: "short", day: "numeric" }),
        revenue: revenue(list),
        orders: list.length,
      });
    }
  }

  const byCategory = new Map<string, number>();
  current.filter(counts).forEach((o) => o.items.forEach((i) => byCategory.set(i.category, (byCategory.get(i.category) ?? 0) + i.price * i.qty)));
  const categories = Array.from(byCategory, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const byProduct = new Map<string, { title: string; image: string; units: number; revenue: number }>();
  current.filter(counts).forEach((o) =>
    o.items.forEach((i) => {
      const cur = byProduct.get(i.productId) ?? { title: i.title, image: i.image, units: 0, revenue: 0 };
      cur.units += i.qty;
      cur.revenue += i.price * i.qty;
      byProduct.set(i.productId, cur);
    })
  );
  const topProducts = Array.from(byProduct.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const lowStock = db.products
    .filter((p) => p.status === "active")
    .flatMap((p) => Object.entries(p.inventory).filter(([, n]) => n <= 3).map(([size, n]) => ({ id: p.id, title: p.title, size, units: n })))
    .slice(0, 6);

  return json({ range, kpis, series, categories, topProducts, lowStock, recentOrders: db.orders.slice(0, 8) });
}
