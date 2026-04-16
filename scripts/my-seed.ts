/**
 * Personal seed — Airelle's real cafe history.
 *
 * Usage:
 *   npm run seed:personal
 *   npm run seed:personal -- --clear   # wipe then re-seed
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import mongoose, { Types } from "mongoose";

import Entry from "../src/lib/models/Entry";
import Cafe from "../src/lib/models/Cafe";
import User from "../src/lib/models/User";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI not found in .env.local");
  process.exit(1);
}

const DEV_USER_ID = new Types.ObjectId("000000000000000000000001");
const CLEAR = process.argv.includes("--clear");

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const CAFES = [
  { name: "OH HEY THERE",    address: "Paranaque, Metro Manila",  tags: ["cozy", "aesthetic"],       isFavorite: true  },
  { name: "Pedal Cafe",      address: "Las Piñas, Metro Manila",  tags: ["cafe", "casual"],          isFavorite: false },
  { name: "Pickup Coffee",   address: "Las Piñas, Metro Manila",  tags: ["casual", "grab-and-go"],   isFavorite: false },
] as const;

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}

type EntryDef = {
  cafeIdx: number;
  beverageName: string;
  category: string;
  date: Date;
  basePrice: number;
  addOns?: { name: string; category: string; price: number }[];
  rating: number;
  personalNotes?: string;
};

const ENTRY_DEFS: EntryDef[] = [
  // ── April 2026 ─────────────────────────────────────────────────────────────
  {
    cafeIdx: 0,
    beverageName: "Sea Salt Cream Cocoa",
    category: "Matcha",
    date: daysAgo(15), // April 1, 2026
    basePrice: 230,
    rating: 4.5,
  },

  // ── March 2026 ─────────────────────────────────────────────────────────────
  {
    cafeIdx: 1,
    beverageName: "Spanish Latte",
    category: "Coffee",
    date: daysAgo(41), // March 6, 2026
    basePrice: 160,
    rating: 2.5,
  },
  {
    cafeIdx: 2,
    beverageName: "Kape Kastilya",
    category: "Coffee",
    date: daysAgo(45), // March 2, 2026
    basePrice: 75,
    rating: 3.5,
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seed() {
  console.log("🔌  Connecting to MongoDB…");
  await mongoose.connect(MONGODB_URI as string);
  console.log("✅  Connected");

  if (CLEAR) {
    console.log("🗑️   Clearing existing data for dev user…");
    await Entry.deleteMany({ userId: DEV_USER_ID });
    await Cafe.deleteMany({ userId: DEV_USER_ID });
    await User.deleteOne({ _id: DEV_USER_ID });
    console.log("✅  Cleared");
  }

  console.log("\n👤  Seeding dev user…");
  await User.findOneAndUpdate(
    { _id: DEV_USER_ID },
    {
      $setOnInsert: {
        _id: DEV_USER_ID,
        name: "Airelle M.",
        email: "dev@brewmemoir.local",
        authProvider: "credentials",
        preferences: { monthlyBudget: 1_500, currency: "PHP" },
      },
    },
    { upsert: true, returnDocument: "after" }
  );
  console.log("   • Airelle M. (budget: ₱1,500/month)");

  console.log(`\n☕  Seeding ${CAFES.length} cafes…`);
  const cafeIds: Types.ObjectId[] = [];

  for (const cafeData of CAFES) {
    const cafe = await Cafe.findOneAndUpdate(
      { userId: DEV_USER_ID, name: cafeData.name },
      { $setOnInsert: { userId: DEV_USER_ID, ...cafeData } },
      { upsert: true, returnDocument: "after" }
    );
    cafeIds.push(cafe._id as Types.ObjectId);
    console.log(`   • ${cafeData.name}`);
  }

  console.log(`\n📓  Seeding ${ENTRY_DEFS.length} entries…`);

  for (const def of ENTRY_DEFS) {
    const cafeId = cafeIds[def.cafeIdx];
    const cafeData = CAFES[def.cafeIdx];
    const addOns = (def.addOns ?? []) as { name: string; category: string; price: number }[];
    const totalPrice = def.basePrice + addOns.reduce((s, a) => s + a.price, 0);

    await Entry.findOneAndUpdate(
      { userId: DEV_USER_ID, beverageName: def.beverageName, date: def.date },
      {
        $setOnInsert: {
          userId: DEV_USER_ID,
          cafeId,
          cafeName: cafeData.name,
          cafeCity: cafeData.address,
          beverageName: def.beverageName,
          category: def.category,
          date: def.date,
          basePrice: def.basePrice,
          addOns,
          totalPrice,
          rating: def.rating,
          tastingNotes: [],
          ...(def.personalNotes ? { personalNotes: def.personalNotes } : {}),
        },
      },
      { upsert: true }
    );

    console.log(`   • [${cafeData.name}] ${def.beverageName} — ₱${totalPrice}`);
  }

  const totalSpent = ENTRY_DEFS.reduce(
    (s, d) => s + d.basePrice + (d.addOns ?? []).reduce((a, o) => a + o.price, 0),
    0
  );

  console.log(
    `\n✅  Done! ${CAFES.length} cafes · ${ENTRY_DEFS.length} entries · ₱${totalSpent.toLocaleString("en-PH")} total spend seeded`
  );
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});