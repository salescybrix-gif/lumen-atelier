import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth-edge";

/**
 * Route protection (RBAC):
 *  - /account/*        → any signed-in user
 *  - /admin/*          → admin role only
 *  - /api/admin/*      → admin role only (handlers re-check against the database too)
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/api/admin")) {
    if (!session) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
    if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.next();
  }

  const needsAdmin = pathname.startsWith("/admin");
  const needsUser = needsAdmin || pathname.startsWith("/account");

  if (needsUser && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  if (needsAdmin && session?.role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "?denied=1";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/api/admin/:path*"],
};
