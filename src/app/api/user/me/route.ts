import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";

const DEV_USER_ID = "000000000000000000000001";
function isBypassAuth() {
  return process.env.BYPASS_AUTH === "true" && process.env.NODE_ENV !== "production";
}

// ---------------------------------------------------------------------------
// GET /api/user/me
//
// Returns the authenticated user's public profile.
//
// Response:
//   name         — display name
//   email        — email address
//   image        — avatar URL (nullable)
//   memberSince  — ISO date string from createdAt
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest) {
  let userId: string;
  try {
    const session = await getAuthSession();
    userId = session.user.id;
  } catch {
    if (isBypassAuth()) {
      userId = DEV_USER_ID;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  await connectDB();
  const user = await User.findById(userId)
    .select("name email image createdAt")
    .lean();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const u = user as {
    name: string;
    email: string;
    image?: string;
    createdAt: Date;
  };

  return NextResponse.json({
    name: u.name,
    email: u.email,
    image: u.image ?? null,
    memberSince: u.createdAt.toISOString(),
  });
}
