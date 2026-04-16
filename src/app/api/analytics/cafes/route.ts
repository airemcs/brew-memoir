import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getAuthSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Entry } from "@/lib/models";

const DEV_USER_ID = "000000000000000000000001";
function isBypassAuth() {
  return process.env.BYPASS_AUTH === "true" && process.env.NODE_ENV !== "production";
}

// ---------------------------------------------------------------------------
// GET /api/analytics/cafes
//
// Returns portfolio-level cafe spending stats for the authenticated user.
//
// Response:
//   portfolioTotal — all-time total spend across all cafes
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

  const result = await Entry.aggregate([
    { $match: { userId: userObjectId } },
    { $group: { _id: null, portfolioTotal: { $sum: "$totalPrice" } } },
  ]);

  const portfolioTotal: number = result[0]?.portfolioTotal ?? 0;

  return NextResponse.json({ portfolioTotal });
}
