import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { SESSION_COOKIE, verifySession } from "@/lib/auth-edge";
import type { SessionUser, User } from "@/types";

/** Reads the session cookie and confirms the user still exists and is active. */
export async function getSession(): Promise<{ session: SessionUser; user: User } | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session) return null;
  const user = getDb().users.find((u) => u.id === session.id);
  if (!user || !user.active) return null;
  return { session: { id: user.id, name: user.name, email: user.email, role: user.role }, user };
}

export function json<T>(data: T, init?: number | ResponseInit) {
  return NextResponse.json(data, typeof init === "number" ? { status: init } : init);
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Guards for API route handlers. Return either the auth context or an error response. */
export async function requireUser() {
  const ctx = await getSession();
  if (!ctx) return { error: error("Please sign in to continue.", 401) } as const;
  return { ctx } as const;
}

export async function requireAdmin() {
  const ctx = await getSession();
  if (!ctx) return { error: error("Please sign in to continue.", 401) } as const;
  if (ctx.user.role !== "admin") return { error: error("You don't have permission to do that.", 403) } as const;
  return { ctx } as const;
}
