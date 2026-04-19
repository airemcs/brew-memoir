import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getRouteUserId } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Entry, Cafe } from "@/lib/models";
import { CreateEntrySchema, validate } from "@/lib/validation";
import { BEVERAGE_CATEGORIES } from "@/types";
import type { BeverageCategory } from "@/types";

// ---------------------------------------------------------------------------
// GET /api/entries
//
// Returns a paginated list of entries for the authenticated user.
//
// Query params:
//   page     — 1-based page number (default: 1)
//   limit    — items per page (default: 20, max: 100)
//   category — filter by BeverageCategory (optional)
//
// Response: { entries, total, page, totalPages }
// ---------------------------------------------------------------------------


export async function GET(req: NextRequest) {
  const userId = await getRouteUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const category = searchParams.get("category");
  const search = searchParams.get("search")?.trim();

  const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId) };

  if (category && (BEVERAGE_CATEGORIES as readonly string[]).includes(category)) {
    filter.category = category as BeverageCategory;
  }

  if (search) {
    const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ cafeName: re }, { beverageName: re }, { cafeCity: re }];
  }

  const [entries, total] = await Promise.all([
    Entry.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Entry.countDocuments(filter),
  ]);

  return NextResponse.json({
    entries,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

// ---------------------------------------------------------------------------
// POST /api/entries
//
// Creates a new entry for the authenticated user.
// - Validates the body with Zod (CreateEntrySchema)
// - Recomputes totalPrice server-side from basePrice + sum(addOns.price)
// - Upserts a Cafe document by (userId + cafeName) so the Cafes directory
//   is always in sync — no separate API call needed from the client
//
// Response: the created entry document (201)
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const userId = await getRouteUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = validate(CreateEntrySchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data } = parsed;
  await connectDB();

  // Recompute totalPrice on the server — never trust the client's value
  const totalPrice = data.basePrice + data.addOns.reduce((sum, a) => sum + a.price, 0);

  const userObjectId = new Types.ObjectId(userId);

  // Upsert Cafe: ensures a record exists for every unique cafeName per user.
  // findOneAndUpdate with upsert avoids a race condition vs. findOne + create.
  const cafe = await Cafe.findOneAndUpdate(
    { userId: userObjectId, name: data.cafeName },
    {
      $setOnInsert: {
        userId: userObjectId,
        name: data.cafeName,
        address: data.cafeCity,
        neighborhood: data.cafeCity,
        tags: [],
        isFavorite: false,
      },
    },
    { upsert: true, new: true }
  );

  // Upsert branch: find existing by label (case-insensitive) or push a new one
  let branchId: import("mongoose").Types.ObjectId | undefined;
  if (data.branchLabel?.trim()) {
    const label = data.branchLabel.trim();
    const labelLower = label.toLowerCase();
    const existing = cafe.branches?.find((b) => b.label.toLowerCase() === labelLower);
    if (existing) {
      branchId = existing._id;
    } else {
      const updated = await Cafe.findByIdAndUpdate(
        cafe._id,
        { $push: { branches: { label, city: data.cafeCity || undefined } } },
        { new: true }
      );
      branchId = updated?.branches.find((b) => b.label.toLowerCase() === labelLower)?._id;
    }
  }

  const entry = await Entry.create({
    ...data,
    userId: userObjectId,
    cafeId: cafe._id,
    branchId,
    branchLabel: data.branchLabel?.trim() || undefined,
    totalPrice,
    date: new Date(data.date),
  });

  return NextResponse.json(entry, { status: 201 });
}
