import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getAuthSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Entry } from "@/lib/models";
import type { BeverageCategory } from "@/types";

const DEV_USER_ID = "000000000000000000000001";
function isBypassAuth() {
  return process.env.BYPASS_AUTH === "true" && process.env.NODE_ENV !== "production";
}

// ---------------------------------------------------------------------------
// GET /api/analytics/overview
//
// Returns current-month aggregation stats for the authenticated user.
//
// Response:
//   currentMonth: {
//     totalSpent       — sum of totalPrice for entries this month
//     totalDrinks      — count of entries this month
//     averagePerDrink  — totalSpent / totalDrinks (0 if no entries)
//     topChoices       — top 3 most-logged beverage names this month
//     categoryBreakdown — [{ category, count, total, percentage }] sorted by count desc
//   }
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

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalsAgg, categoryAgg, topChoicesAgg] = await Promise.all([
    // 1. Month totals
    Entry.aggregate([
      { $match: { userId: userObjectId, date: { $gte: startOfMonth } } },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: "$totalPrice" },
          totalDrinks: { $sum: 1 },
        },
      },
    ]),

    // 2. Category breakdown
    Entry.aggregate([
      { $match: { userId: userObjectId, date: { $gte: startOfMonth } } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          total: { $sum: "$totalPrice" },
        },
      },
      { $sort: { count: -1 } },
    ]),

    // 3. Top 3 beverage names by frequency
    Entry.aggregate([
      { $match: { userId: userObjectId, date: { $gte: startOfMonth } } },
      { $group: { _id: "$beverageName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]),
  ]);

  const totalSpent: number = totalsAgg[0]?.totalSpent ?? 0;
  const totalDrinks: number = totalsAgg[0]?.totalDrinks ?? 0;
  const averagePerDrink = totalDrinks > 0 ? Math.round(totalSpent / totalDrinks) : 0;

  const totalDrinksForPct = categoryAgg.reduce(
    (s: number, r: { count: number }) => s + r.count,
    0
  );
  const categoryBreakdown = categoryAgg.map(
    (r: { _id: BeverageCategory; count: number; total: number }) => ({
      category: r._id,
      count: r.count,
      total: r.total,
      percentage:
        totalDrinksForPct > 0
          ? Math.round((r.count / totalDrinksForPct) * 100)
          : 0,
    })
  );

  const topChoices: string[] = topChoicesAgg.map(
    (r: { _id: string }) => r._id
  );

  return NextResponse.json({
    currentMonth: {
      totalSpent,
      totalDrinks,
      averagePerDrink,
      topChoices,
      categoryBreakdown,
    },
  });
}
