import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getAuthSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Cafe, Entry } from "@/lib/models";

const DEV_USER_ID = "000000000000000000000001";
function isBypassAuth() {
  return process.env.BYPASS_AUTH === "true" && process.env.NODE_ENV !== "production";
}

// ---------------------------------------------------------------------------
// GET /api/cafes
//
// Returns all cafes for the authenticated user with aggregated stats.
// Each cafe is joined with its entries to compute:
//   totalVisits, totalSpent, averageRating, lastVisited
//
// Response: ICafeWithStats[]
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
  const userObjectId = new Types.ObjectId(userId);

  // Aggregate entries per cafe to compute stats, then join with the Cafe docs
  const statsPerCafe = await Entry.aggregate([
    { $match: { userId: userObjectId } },
    {
      $group: {
        _id: "$cafeId",
        totalVisits: { $sum: 1 },
        totalSpent: { $sum: "$totalPrice" },
        averageRating: { $avg: "$rating" },
        lastVisited: { $max: "$date" },
      },
    },
  ]);

  // Index by cafeId string for O(1) lookup when building the response
  const statsMap = new Map(
    statsPerCafe.map((s) => [s._id?.toString(), s])
  );

  const cafes = await Cafe.find({ userId: userObjectId }).sort({ updatedAt: -1 }).lean();

  const result = cafes.map((cafe) => {
    const stats = statsMap.get(cafe._id.toString());
    return {
      ...cafe,
      stats: {
        totalVisits: stats?.totalVisits ?? 0,
        totalSpent: stats?.totalSpent ?? 0,
        averageRating: stats?.averageRating ? Math.round(stats.averageRating * 10) / 10 : null,
        lastVisited: stats?.lastVisited ?? null,
      },
    };
  });

  return NextResponse.json(result);
}
