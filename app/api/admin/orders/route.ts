import { getDb } from "@/lib/db";
import { json, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  return json({ orders: getDb().orders });
}
