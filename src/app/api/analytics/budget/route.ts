import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getAuthSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Entry, User } from "@/lib/models";

const DEV_USER_ID = "000000000000000000000001";
function isBypassAuth() {
  return process.env.BYPASS_AUTH === "true" && process.env.NODE_ENV !== "production";
}

// ---------------------------------------------------------------------------
// GET /api/analytics/budget
//
// Returns the authenticated user's monthly budget and current-month spend.
//
// Response:
//   totalSpent     — sum of totalPrice for entries this month
//   budgetAmount   — user.preferences.monthlyBudget (default 10 000)
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

  const [spendAgg, user] = await Promise.all([
    Entry.aggregate([
      { $match: { userId: userObjectId, date: { $gte: startOfMonth } } },
      { $group: { _id: null, totalSpent: { $sum: "$totalPrice" } } },
    ]),
    User.findById(userObjectId).select("preferences").lean(),
  ]);

  const totalSpent: number = spendAgg[0]?.totalSpent ?? 0;
  // Fall back to 10 000 for dev users who may not have a User document
  const budgetAmount: number =
    (user as { preferences?: { monthlyBudget?: number } } | null)
      ?.preferences?.monthlyBudget ?? 2_000;

  return NextResponse.json({ totalSpent, budgetAmount });
}
