import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { commit, getDb } from "@/lib/db";
import { error, json } from "@/lib/auth";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth-edge";
import { uid } from "@/lib/utils";
import type { User } from "@/types";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (name.length < 2) return error("Please enter your full name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error("Please enter a valid email address.");
  if (password.length < 8) return error("Password must be at least 8 characters.");

  const db = getDb();
  if (db.users.some((u) => u.email === email)) return error("An account with this email already exists.", 409);

  const user: User = {
    id: uid("usr"),
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: "customer",
    active: true,
    createdAt: new Date().toISOString(),
    addresses: [],
    paymentMethods: [],
  };
  db.users.push(user);
  commit();

  const session = { id: user.id, name: user.name, email: user.email, role: user.role };
  cookies().set(SESSION_COOKIE, await signSession(session), sessionCookieOptions);
  return json({ user: session }, 201);
}
