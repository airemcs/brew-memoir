import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";

const DEV_USER_ID = "000000000000000000000001";
function isBypassAuth() {
  return process.env.BYPASS_AUTH === "true" && process.env.NODE_ENV !== "production";
}

const VALID_CURRENCIES = ["PHP", "USD", "SGD", "JPY", "EUR", "GBP"] as const;

const PreferencesSchema = z.object({
  monthlyBudget: z.number().positive().finite().optional(),
  currency: z.enum(VALID_CURRENCIES).optional(),
}).refine((d) => d.monthlyBudget !== undefined || d.currency !== undefined, {
  message: "At least one preference field must be provided",
});

// ---------------------------------------------------------------------------
// GET /api/user/preferences
//
// Returns the authenticated user's preferences.
//
// Response:
//   monthlyBudget — monthly spend target
//   currency      — ISO 4217 currency code (e.g. "PHP")
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

  const prefs = (user as { preferences?: { monthlyBudget?: number; currency?: string } } | null)
    ?.preferences;

  return NextResponse.json({
    monthlyBudget: prefs?.monthlyBudget ?? 2_000,
    currency: prefs?.currency ?? "PHP",
  });
}

// ---------------------------------------------------------------------------
// PUT /api/user/preferences
//
// Updates the authenticated user's preferences (partial update).
//
// Body: { monthlyBudget?: number, currency?: string }
// Response: full updated preferences
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

  const $set: Record<string, unknown> = {};
  if (parsed.data.monthlyBudget !== undefined)
    $set["preferences.monthlyBudget"] = parsed.data.monthlyBudget;
  if (parsed.data.currency !== undefined)
    $set["preferences.currency"] = parsed.data.currency;

  await connectDB();

  const updated = await User.findByIdAndUpdate(
    userId,
    { $set },
    { new: true, upsert: false, select: "preferences" }
  ).lean();

  const prefs = (updated as { preferences?: { monthlyBudget?: number; currency?: string } } | null)
    ?.preferences;

  return NextResponse.json({
    monthlyBudget: prefs?.monthlyBudget ?? parsed.data.monthlyBudget ?? 2_000,
    currency: prefs?.currency ?? parsed.data.currency ?? "PHP",
  });
}
