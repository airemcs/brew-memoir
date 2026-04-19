import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getRouteUserId } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Cafe, Entry } from "@/lib/models";


// ---------------------------------------------------------------------------
// GET /api/cafes/[id]/entries
//
// Returns the brew history for a specific cafe, sorted by date desc.
// Verifies the cafe belongs to the requesting user before querying entries.
//
// Query params:
//   limit — max entries to return (default: 20, max: 100)
// ---------------------------------------------------------------------------

export async function GET(
  req: NextRequest,
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

  // Ownership check — ensures users can't query another user's cafe history
  const cafe = await Cafe.findOne({ _id: cafeObjectId, userId: userObjectId }).lean();
  if (!cafe) {
    return NextResponse.json({ error: "Cafe not found" }, { status: 404 });
  }

  const limit = Math.min(
    100,
    Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10))
  );

  const entries = await Entry.find({ userId: userObjectId, cafeId: cafeObjectId })
    .sort({ date: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json(entries);
}
