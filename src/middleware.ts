import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Route protection middleware
//
// All /api/* routes require a valid JWT session, except /api/auth/* which
// is handled by NextAuth itself (sign-in, callback, CSRF token, etc.).
// ---------------------------------------------------------------------------

export async function middleware(req: NextRequest) {
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
  // Match all /api/* paths except /api/auth/*
  matcher: ["/api/((?!auth/).*)"],
};
