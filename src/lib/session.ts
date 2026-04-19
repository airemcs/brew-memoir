import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Augmented session type — includes the MongoDB _id set by the JWT callback
// in auth.ts so callers don't need to cast manually.
// ---------------------------------------------------------------------------

export type AuthSession = Session & {
  user: NonNullable<Session["user"]> & { id: string };
};

// ---------------------------------------------------------------------------
// getAuthSession
//
// Use in Server Components, Route Handlers, and Server Actions.
// Throws an Error("Unauthorized") when there is no valid session so callers
// can handle it once at the route boundary:
//
//   try {
//     const session = await getAuthSession();
//     const userId = session.user.id;
//     ...
//   } catch {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }
// ---------------------------------------------------------------------------

export async function getAuthSession(): Promise<AuthSession> {
  const session = await getServerSession(authOptions);

  if (!session?.user || !(session.user as AuthSession["user"]).id) {
    throw new Error("Unauthorized");
  }

  return session as AuthSession;
}

// ---------------------------------------------------------------------------
// getRouteUserId
//
// For use in Route Handlers only. Returns the authenticated user's MongoDB _id,
// or the dev placeholder when BYPASS_AUTH=true in non-production.
// Returns null when unauthenticated — callers should return a 401.
// ---------------------------------------------------------------------------

const DEV_USER_ID = "000000000000000000000001";

export async function getRouteUserId(): Promise<string | null> {
  try {
    const session = await getAuthSession();
    return session.user.id;
  } catch {
    if (process.env.BYPASS_AUTH === "true" && process.env.NODE_ENV !== "production") {
      return DEV_USER_ID;
    }
    return null;
  }
}
