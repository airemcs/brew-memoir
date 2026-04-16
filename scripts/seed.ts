/**
 * Seed script — populates the dev user's DB with sample cafes + entries.
 *
 * Usage:
 *   npm run seed          # seed
 *   npm run seed -- --clear   # wipe then re-seed
 *
 * Targets the DEV_USER_ID (000000000000000000000001) used when BYPASS_AUTH=true.
 */

// Must be first — sets process.env before any other module reads it
import { config } from "dotenv";
config({ path: ".env.local" });

import mongoose, { Types } from "mongoose";

// Direct model imports (avoid pulling in src/lib/db.ts which reads env at module level)
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
  { name: "Yardstick Coffee",   address: "Salcedo Village, Makati",   tags: ["specialty", "pour-over"],    isFavorite: true  },
  { name: "Kurasu",             address: "Poblacion, Makati",         tags: ["japanese", "matcha"],        isFavorite: false },
  { name: "Sightglass",         address: "BGC, Taguig",               tags: ["espresso", "aeropress"],     isFavorite: true  },
  { name: "The Curator",        address: "Legazpi Village, Makati",   tags: ["craft", "cocktails"],        isFavorite: false },
  { name: "Kalsada Coffee",     address: "Quezon City",               tags: ["local-roast", "specialty"],  isFavorite: false },
] as const;

// Relative helper: days ago from now
function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}

// Entries are defined AFTER cafes are inserted so we can reference real cafeIds.
// Each tuple: [cafeIdx, entry fields]
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
  // ── Yardstick (idx 0) ──────────────────────────────────────────────────────
  {
    cafeIdx: 0,
    beverageName: "Ethiopia Yirgacheffe V60",
    category: "Coffee",
    date: daysAgo(2),
    basePrice: 195,
    rating: 5,
    personalNotes: "Bright citrus notes, incredibly clean finish. The bloom was textbook.",
  },
  {
    cafeIdx: 0,
    beverageName: "Spanish Latte",
    category: "Espresso & Milk",
    date: daysAgo(9),
    basePrice: 175,
    addOns: [{ name: "Oat Milk", category: "alternative", price: 60 }],
    rating: 4.5,
    personalNotes: "Silky with a gentle sweetness. Oat milk elevated it.",
  },
  {
    cafeIdx: 0,
    beverageName: "Aeropress Colombia",
    category: "Coffee",
    date: daysAgo(22),
    basePrice: 185,
    rating: 4,
  },
  {
    cafeIdx: 0,
    beverageName: "Cold Brew Tonic",
    category: "Coffee",
    date: daysAgo(38),
    basePrice: 210,
    rating: 4.5,
    personalNotes: "Perfect afternoon drink. Effervescent and refreshing.",
  },

  // ── Kurasu (idx 1) ─────────────────────────────────────────────────────────
  {
    cafeIdx: 1,
    beverageName: "Toasted Hojicha Flat White",
    category: "Hojicha",
    date: daysAgo(1),
    basePrice: 195,
    addOns: [{ name: "Extra Shot", category: "intensity", price: 50 }],
    rating: 5,
    personalNotes: "Roasty depth with a velvety texture. This is a masterpiece.",
  },
  {
    cafeIdx: 1,
    beverageName: "Matcha Latte",
    category: "Matcha",
    date: daysAgo(7),
    basePrice: 185,
    rating: 4.5,
    personalNotes: "Deep umami, not too sweet. Just how I like it.",
  },
  {
    cafeIdx: 1,
    beverageName: "Houjicha Affogato",
    category: "Hojicha",
    date: daysAgo(15),
    basePrice: 220,
    rating: 4,
  },
  {
    cafeIdx: 1,
    beverageName: "Ceremonial Matcha",
    category: "Matcha",
    date: daysAgo(42),
    basePrice: 245,
    rating: 5,
    personalNotes: "First time trying ceremonial grade here. Life-changing.",
  },

  // ── Sightglass (idx 2) ─────────────────────────────────────────────────────
  {
    cafeIdx: 2,
    beverageName: "Cappuccino",
    category: "Espresso & Milk",
    date: daysAgo(3),
    basePrice: 165,
    rating: 4,
  },
  {
    cafeIdx: 2,
    beverageName: "Iced Americano",
    category: "Espresso & Milk",
    date: daysAgo(11),
    basePrice: 145,
    addOns: [{ name: "Extra Shot", category: "intensity", price: 50 }],
    rating: 3.5,
    personalNotes: "A bit bitter today. Maybe over-extracted.",
  },
  {
    cafeIdx: 2,
    beverageName: "Flat White",
    category: "Espresso & Milk",
    date: daysAgo(28),
    basePrice: 175,
    rating: 4.5,
  },

  // ── The Curator (idx 3) ────────────────────────────────────────────────────
  {
    cafeIdx: 3,
    beverageName: "Signature Cold Brew",
    category: "Coffee",
    date: daysAgo(5),
    basePrice: 225,
    rating: 4,
    personalNotes: "Complex and full-bodied. Worth the price.",
  },
  {
    cafeIdx: 3,
    beverageName: "Honey Lavender Latte",
    category: "Specialty",
    date: daysAgo(19),
    basePrice: 210,
    addOns: [{ name: "Oat Milk", category: "alternative", price: 60 }],
    rating: 4.5,
    personalNotes: "Floral and comforting. The lavender wasn't overpowering.",
  },

  // ── Kalsada (idx 4) ────────────────────────────────────────────────────────
  {
    cafeIdx: 4,
    beverageName: "Benguet Single Origin Drip",
    category: "Coffee",
    date: daysAgo(4),
    basePrice: 155,
    rating: 5,
    personalNotes: "Local pride. Nutty and smooth with a brown sugar finish.",
  },
  {
    cafeIdx: 4,
    beverageName: "Iced Chocolate",
    category: "Chocolate",
    date: daysAgo(33),
    basePrice: 175,
    addOns: [{ name: "Oat Milk", category: "alternative", price: 60 }],
    rating: 4,
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
    console.log("🗑️   Clearing existing seed data for dev user…");
    await Entry.deleteMany({ userId: DEV_USER_ID });
    await Cafe.deleteMany({ userId: DEV_USER_ID });
    await User.deleteOne({ _id: DEV_USER_ID });
    console.log("✅  Cleared");
  }

  // Upsert dev user so preferences can be persisted
  console.log("\n👤  Seeding dev user…");
  await User.findOneAndUpdate(
    { _id: DEV_USER_ID },
    {
      $setOnInsert: {
        _id: DEV_USER_ID,
        name: "Airelle M.",
        email: "dev@brewmemoir.local",
        authProvider: "credentials",
        preferences: { monthlyBudget: 10_000, currency: "PHP" },
      },
    },
    { upsert: true, returnDocument: "after" }
  );
  console.log("   • dev@brewmemoir.local (id: 000000000000000000000001)");

  // Insert cafes (upsert by name to stay idempotent)
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

  // Insert entries
  console.log(`\n📓  Seeding ${ENTRY_DEFS.length} entries…`);

  for (const def of ENTRY_DEFS) {
    const cafeId = cafeIds[def.cafeIdx];
    const cafeData = CAFES[def.cafeIdx];
    const addOns = (def.addOns ?? []) as { name: string; category: string; price: number }[];
    const totalPrice = def.basePrice + addOns.reduce((s, a) => s + a.price, 0);

    // Upsert by userId + beverageName + date to stay idempotent
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

  console.log(`\n✅  Done! ${CAFES.length} cafes · ${ENTRY_DEFS.length} entries · ₱${totalSpent.toLocaleString("en-PH")} total spend seeded`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
