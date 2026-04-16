import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Shared userId resolver for server components.
// Returns the authenticated user's MongoDB _id string, or the dev
// placeholder when BYPASS_AUTH=true. Returns null if unauthenticated.
// ---------------------------------------------------------------------------

const DEV_USER_ID = "000000000000000000000001";

export async function getServerUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    const id = (session?.user as { id?: string } | undefined)?.id;
    if (id) return id;
  } catch {
    // getServerSession throws when NEXTAUTH_SECRET is missing
  }

  if (
    process.env.BYPASS_AUTH === "true" &&
    process.env.NODE_ENV !== "production"
  ) {
    return DEV_USER_ID;
  }

  return null;
}
