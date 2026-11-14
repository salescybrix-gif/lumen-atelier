import { commit, getDb, publicUser } from "@/lib/db";
import { error, json, requireAdmin } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const db = getDb();
  const user = db.users.find((u) => u.id === params.id);
  if (!user) return error("Customer not found.", 404);
  return json({ customer: publicUser(user), orders: db.orders.filter((o) => o.userId === user.id) });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const db = getDb();
  const user = db.users.find((u) => u.id === params.id);
  if (!user) return error("Customer not found.", 404);
  if (user.id === auth.ctx.user.id) return error("You can't deactivate your own account.");
  const body = await req.json().catch(() => ({}));
  if (typeof body.active === "boolean") user.active = body.active;
  commit();
  return json({ customer: publicUser(user) });
}
