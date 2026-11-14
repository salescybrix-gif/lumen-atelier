import { cookies } from "next/headers";
import { json } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/auth-edge";

export async function POST() {
  cookies().delete(SESSION_COOKIE);
  return json({ ok: true });
}
