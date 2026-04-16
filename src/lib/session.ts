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
