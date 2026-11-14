import { getDb, publicUser } from "@/lib/db";
import { json, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const db = getDb();
  const customers = db.users
    .map((u) => {
      const orders = db.orders.filter((o) => o.userId === u.id);
      const spend = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total - o.refunded, 0);
      const last = orders[0]?.createdAt ?? null;
      return { ...publicUser(u), orderCount: orders.length, lifetimeSpend: spend, lastOrderAt: last };
    })
    .sort((a, b) => b.lifetimeSpend - a.lifetimeSpend);
  return json({ customers });
}
