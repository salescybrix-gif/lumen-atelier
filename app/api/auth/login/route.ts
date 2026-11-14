import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { error, json } from "@/lib/auth";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth-edge";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  const user = getDb().users.find((u) => u.email === email);
  // Always run a hash comparison to keep response timing uniform.
  const ok = await bcrypt.compare(password, user?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
  if (!user || !ok) return error("Incorrect email or password.", 401);
  if (!user.active) return error("This account has been deactivated. Please contact support.", 403);

  const session = { id: user.id, name: user.name, email: user.email, role: user.role };
  cookies().set(SESSION_COOKIE, await signSession(session), sessionCookieOptions);
  return json({ user: session });
}
