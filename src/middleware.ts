import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Route protection middleware
//
// All /api/* routes require a valid JWT session, except /api/auth/* which
// is handled by NextAuth itself (sign-in, callback, CSRF token, etc.).
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

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  // Temporarily excludes /api/entries during dev testing (no auth yet).
  // Re-add entries to protection once auth pages are built.
  matcher: ["/api/((?!auth/|health|entries).*)"],
};
