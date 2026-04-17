import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Route protection middleware
//
// - Page routes: unauthenticated users are redirected to /auth/signin
// - API routes:  unauthenticated requests get a 401 JSON response
// - /auth/* and /api/auth/* are always public (NextAuth + sign-in/sign-up UI)
// - /api/health is public
// ---------------------------------------------------------------------------

export async function middleware(req: NextRequest) {
  // Dev-only bypass — set BYPASS_AUTH=true in .env.local to skip JWT checks.
  // Never set this in production.
  if (
    process.env.BYPASS_AUTH === "true" &&
    process.env.NODE_ENV !== "production"
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protect all pages except /auth/*
    "/((?!auth/|_next/static|_next/image|favicon.ico).*)",
    // Protect all API routes except /api/auth/* and /api/health
    "/api/((?!auth/|health).*)",
  ],
};
