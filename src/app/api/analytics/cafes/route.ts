import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getRouteUserId } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Entry } from "@/lib/models";

// ---------------------------------------------------------------------------
// GET /api/analytics/cafes
//
// Returns portfolio-level cafe spending stats for the authenticated user.
//
// Response:
//   portfolioTotal — all-time total spend across all cafes
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest) {
  const userId = await getRouteUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const userObjectId = new Types.ObjectId(userId);

  const result = await Entry.aggregate([
    { $match: { userId: userObjectId } },
    { $group: { _id: null, portfolioTotal: { $sum: "$totalPrice" } } },
  ]);

  const portfolioTotal: number = result[0]?.portfolioTotal ?? 0;

  return NextResponse.json({ portfolioTotal });
}
