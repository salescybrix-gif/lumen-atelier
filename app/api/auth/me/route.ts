import { getSession, json } from "@/lib/auth";
import { publicUser } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getSession();
  return json({ user: ctx ? ctx.session : null, profile: ctx ? publicUser(ctx.user) : null });
}
