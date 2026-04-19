import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getRouteUserId } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Cafe, Entry } from "@/lib/models";
import { deleteImage, getPublicId } from "@/lib/cloudinary";


// ---------------------------------------------------------------------------
// GET /api/cafes/[id]
//
// Returns a single cafe with full stats:
//   totalSpent, totalVisits, visitsByDay[7], weeklyAverage
//
// weeklyAverage edge case: if the cafe was first visited less than a week ago,
// weeklyAverage returns null rather than an inflated number.
//
// visitsByDay uses MongoDB's $dayOfWeek (1=Sun … 7=Sat), remapped to
// index 0=Mon … 6=Sun to match the frontend DAYS array.
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

  // Aggregate summary stats
  const [summary] = await Entry.aggregate([
    { $match: { userId: userObjectId, cafeId: cafeObjectId } },
    {
      $group: {
        _id: null,
        totalVisits: { $sum: 1 },
        totalSpent: { $sum: "$totalPrice" },
        averageRating: { $avg: "$rating" },
        firstVisit: { $min: "$date" },
        lastVisited: { $max: "$date" },
      },
    },
  ]);

  const totalVisits: number = summary?.totalVisits ?? 0;
  const totalSpent: number = summary?.totalSpent ?? 0;
  const averageRating: number | null = summary?.averageRating
    ? Math.round(summary.averageRating * 10) / 10
    : null;
  const lastVisited: string | null = summary?.lastVisited ?? null;

  // weeklyAverage: only meaningful once at least a full week has passed
  let weeklyAverage: number | null = null;
  if (summary?.firstVisit) {
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weeksSinceFirst = (Date.now() - new Date(summary.firstVisit).getTime()) / msPerWeek;
    weeklyAverage = weeksSinceFirst >= 1
      ? Math.round((totalVisits / weeksSinceFirst) * 10) / 10
      : null;
  }

  // visitsByDay[7]: index 0=Mon … 6=Sun
  // $dayOfWeek returns 1=Sun … 7=Sat, so remap: Mon=(2→0) … Sun=(1→6)
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
    // MongoDB $dayOfWeek: 1=Sun, 2=Mon, …, 7=Sat
    // Target index:       6=Sun, 0=Mon, …, 5=Sat
    const idx = _id === 1 ? 6 : _id - 2;
    visitsByDay[idx] = count;
  }

  return NextResponse.json({
    ...cafe,
    stats: { totalVisits, totalSpent, averageRating, lastVisited },
    visitsByDay,
    weeklyAverage,
  });
}

// ---------------------------------------------------------------------------
// DELETE /api/cafes/[id]
//
// Deletes the cafe and all its entries (including Cloudinary photos).
// ---------------------------------------------------------------------------

export async function DELETE(
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
  if (!cafe) return NextResponse.json({ error: "Cafe not found" }, { status: 404 });

  // Clean up Cloudinary photos for all entries belonging to this cafe
  const entries = await Entry.find({ cafeId: cafeObjectId, userId: userObjectId }).lean();
  await Promise.allSettled(
    entries.filter((e) => e.photoUrl).map((e) => deleteImage(getPublicId(e.photoUrl!)))
  );

  await Entry.deleteMany({ cafeId: cafeObjectId, userId: userObjectId });
  await Cafe.findByIdAndDelete(cafeObjectId);

  return new NextResponse(null, { status: 204 });
}
