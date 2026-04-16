import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";

const DEV_USER_ID = "000000000000000000000001";
function isBypassAuth() {
  return process.env.BYPASS_AUTH === "true" && process.env.NODE_ENV !== "production";
}

const PreferencesSchema = z.object({
  monthlyBudget: z.number().positive().finite(),
});

// ---------------------------------------------------------------------------
// GET /api/user/preferences
//
// Returns the authenticated user's preferences.
//
// Response:
//   monthlyBudget — monthly spend target in PHP
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
  const user = await User.findById(userId).select("preferences").lean();

  const monthlyBudget =
    (user as { preferences?: { monthlyBudget?: number } } | null)
      ?.preferences?.monthlyBudget ?? 10_000;

  return NextResponse.json({ monthlyBudget });
}

// ---------------------------------------------------------------------------
// PUT /api/user/preferences
//
// Updates the authenticated user's preferences.
//
// Body: { monthlyBudget: number }
// Response: updated preferences
// ---------------------------------------------------------------------------

export async function PUT(req: NextRequest) {
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

  const body = await req.json().catch(() => null);
  const parsed = PreferencesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  await connectDB();

  const updated = await User.findByIdAndUpdate(
    userId,
    { $set: { "preferences.monthlyBudget": parsed.data.monthlyBudget } },
    { new: true, upsert: false, select: "preferences" }
  ).lean();

  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const monthlyBudget =
    (updated as { preferences?: { monthlyBudget?: number } })
      ?.preferences?.monthlyBudget ?? parsed.data.monthlyBudget;

  return NextResponse.json({ monthlyBudget });
}
