import { NextRequest, NextResponse } from "next/server";
import { getRouteUserId } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";


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
  const userId = await getRouteUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
