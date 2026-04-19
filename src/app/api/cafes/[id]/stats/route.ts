import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getRouteUserId } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Cafe, Entry } from "@/lib/models";


// ---------------------------------------------------------------------------
// GET /api/cafes/[id]/stats
//
// Returns the visitsByDay[7] breakdown for the visit frequency chart.
// Index 0 = Monday … 6 = Sunday (matches the frontend DAYS constant).
//
// Also returns weeklyAverage and peakDay (index of the highest bar).
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getRouteUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid cafe ID" }, { status: 400 });
  }

  await connectDB();
  const userObjectId = new Types.ObjectId(userId);
  const cafeObjectId = new Types.ObjectId(id);

  const cafe = await Cafe.findOne({ _id: cafeObjectId, userId: userObjectId }).lean();
  if (!cafe) {
    return NextResponse.json({ error: "Cafe not found" }, { status: 404 });
  }

  // visitsByDay aggregation
  // $dayOfWeek: 1=Sun, 2=Mon, …, 7=Sat → remap to 0=Mon … 6=Sun
  const dayAgg = await Entry.aggregate([
    { $match: { userId: userObjectId, cafeId: cafeObjectId } },
    {
      $group: {
        _id: { $dayOfWeek: "$date" },
        count: { $sum: 1 },
      },
    },
  ]);

  const visitsByDay: [number, number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0, 0];
  for (const { _id, count } of dayAgg) {
    const idx = _id === 1 ? 6 : _id - 2;
    visitsByDay[idx] = count;
  }

  // weeklyAverage
  const [summary] = await Entry.aggregate([
    { $match: { userId: userObjectId, cafeId: cafeObjectId } },
    {
      $group: {
        _id: null,
        totalVisits: { $sum: 1 },
        firstVisit: { $min: "$date" },
      },
    },
  ]);

  let weeklyAverage: number | null = null;
  if (summary?.firstVisit) {
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weeksSinceFirst = (Date.now() - new Date(summary.firstVisit).getTime()) / msPerWeek;
    weeklyAverage = weeksSinceFirst >= 1
      ? Math.round((summary.totalVisits / weeksSinceFirst) * 10) / 10
      : null;
  }

  const peakDay = visitsByDay.indexOf(Math.max(...visitsByDay));

  return NextResponse.json({ visitsByDay, weeklyAverage, peakDay });
}
