/**
 * Stress-test seed — 120+ entries across 10 cafes over 6 months.
 * Tests pagination, analytics charts, category breakdown, and history grouping.
 *
 * Usage:
 *   npm run seed:stress
 *   npm run seed:stress -- --clear   # wipe then re-seed
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
// Helpers
// ---------------------------------------------------------------------------

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRating(): number {
  const ratings = [3, 3.5, 3.5, 4, 4, 4, 4, 4.5, 4.5, 4.5, 5, 5];
  return pick(ratings);
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const CAFES = [
  { name: "Yardstick Coffee",       address: "Salcedo Village, Makati",     tags: ["specialty", "pour-over"],       isFavorite: true  },
  { name: "Kurasu",                  address: "Poblacion, Makati",           tags: ["japanese", "matcha"],           isFavorite: true  },
  { name: "Sightglass",             address: "BGC, Taguig",                 tags: ["espresso", "minimalist"],       isFavorite: false },
  { name: "The Curator",            address: "Legazpi Village, Makati",     tags: ["craft", "cocktails"],           isFavorite: false },
  { name: "Kalsada Coffee",         address: "Maginhawa, Quezon City",      tags: ["local-roast", "specialty"],     isFavorite: true  },
  { name: "OH HEY THERE",           address: "Paranaque, Metro Manila",     tags: ["cozy", "aesthetic"],            isFavorite: true  },
  { name: "Pickup Coffee",          address: "Las Piñas, Metro Manila",     tags: ["casual", "grab-and-go"],        isFavorite: false },
  { name: "Bo's Coffee",            address: "Alabang, Muntinlupa",         tags: ["local", "chain"],               isFavorite: false },
  { name: "% Arabica",              address: "BGC, Taguig",                 tags: ["japanese", "minimalist"],       isFavorite: true  },
  { name: "EDSA BDG",               address: "Mandaluyong, Metro Manila",   tags: ["specialty", "design"],          isFavorite: false },
] as const;

// Drink templates per category
const DRINKS: { name: string; category: string; priceRange: [number, number] }[] = [
  // Coffee
  { name: "V60 Ethiopia Yirgacheffe",     category: "Coffee",            priceRange: [180, 220] },
  { name: "Aeropress Colombia",            category: "Coffee",            priceRange: [170, 210] },
  { name: "Drip Coffee",                   category: "Coffee",            priceRange: [120, 160] },
  { name: "Iced Americano",                category: "Coffee",            priceRange: [130, 165] },
  { name: "Cold Brew",                     category: "Coffee",            priceRange: [160, 220] },
  { name: "Cold Brew Tonic",               category: "Coffee",            priceRange: [190, 230] },
  { name: "Benguet Single Origin Drip",    category: "Coffee",            priceRange: [140, 175] },

  // Espresso & Milk
  { name: "Spanish Latte",                 category: "Espresso & Milk",   priceRange: [160, 200] },
  { name: "Flat White",                    category: "Espresso & Milk",   priceRange: [165, 195] },
  { name: "Cappuccino",                    category: "Espresso & Milk",   priceRange: [155, 185] },
  { name: "Cafe Latte",                    category: "Espresso & Milk",   priceRange: [150, 185] },
  { name: "Oat Milk Latte",               category: "Espresso & Milk",   priceRange: [180, 220] },
  { name: "Dirty Matcha Latte",            category: "Espresso & Milk",   priceRange: [200, 250] },

  // Matcha
  { name: "Ceremonial Matcha",             category: "Matcha",            priceRange: [200, 260] },
  { name: "Matcha Latte",                  category: "Matcha",            priceRange: [175, 220] },
  { name: "Iced Matcha Latte",             category: "Matcha",            priceRange: [180, 225] },
  { name: "Sea Salt Cream Matcha",         category: "Matcha",            priceRange: [210, 250] },

  // Hojicha
  { name: "Hojicha Latte",                 category: "Hojicha",           priceRange: [175, 215] },
  { name: "Iced Hojicha Latte",            category: "Hojicha",           priceRange: [180, 220] },
  { name: "Toasted Hojicha Flat White",    category: "Hojicha",           priceRange: [190, 230] },
  { name: "Hojicha Affogato",              category: "Hojicha",           priceRange: [200, 240] },

  // Tea
  { name: "Earl Grey Latte",              category: "Tea",               priceRange: [160, 195] },
  { name: "Chai Latte",                    category: "Tea",               priceRange: [165, 200] },
  { name: "Jasmine Green Tea",             category: "Tea",               priceRange: [120, 155] },

  // Chocolate
  { name: "Sea Salt Cream Cocoa",          category: "Chocolate",         priceRange: [180, 230] },
  { name: "Tablea Hot Chocolate",          category: "Chocolate",         priceRange: [160, 200] },
  { name: "Iced Chocolate",                category: "Chocolate",         priceRange: [155, 195] },

  // Frappe & Blended
  { name: "Matcha Frappe",                 category: "Frappe & Blended",  priceRange: [190, 240] },
  { name: "Mocha Frappe",                  category: "Frappe & Blended",  priceRange: [185, 230] },
  { name: "Cookies & Cream Frappe",        category: "Frappe & Blended",  priceRange: [195, 240] },

  // Fruit & Refresher
  { name: "Yuzu Lemonade",                category: "Fruit & Refresher", priceRange: [160, 200] },
  { name: "Calamansi Soda",               category: "Fruit & Refresher", priceRange: [130, 165] },
  { name: "Strawberry Refresher",          category: "Fruit & Refresher", priceRange: [170, 210] },

  // Specialty
  { name: "Honey Lavender Latte",         category: "Specialty",         priceRange: [200, 250] },
  { name: "Ube Latte",                     category: "Specialty",         priceRange: [185, 225] },
  { name: "Rose Latte",                    category: "Specialty",         priceRange: [190, 235] },
  { name: "Kape Kastilya",                category: "Specialty",         priceRange: [65, 85] },
];

const ADD_ONS = [
  { name: "Oat Milk",           category: "alternative",    price: 50 },
  { name: "Oat Milk",           category: "alternative",    price: 60 },
  { name: "Almond Milk",        category: "alternative",    price: 50 },
  { name: "Soy Milk",           category: "alternative",    price: 40 },
  { name: "Extra Shot",         category: "intensity",      price: 40 },
  { name: "Extra Shot",         category: "intensity",      price: 50 },
  { name: "Vanilla Syrup",      category: "syrup",          price: 30 },
  { name: "Brown Sugar Syrup",  category: "syrup",          price: 35 },
  { name: "Pearls",             category: "topping",        price: 30 },
  { name: "Cream Cheese Foam",  category: "topping",        price: 45 },
  { name: "Whipped Cream",      category: "topping",        price: 25 },
];

const NOTES = [
  "Really smooth and balanced.",
  "A bit too sweet for my taste.",
  "Perfect afternoon pick-me-up.",
  "Would order this again for sure.",
  "Slightly under-extracted today.",
  "The foam art was beautiful.",
  "Better than expected for the price.",
  "Not my favorite, but decent.",
  "Best one I've had this month.",
  "Earthy and complex. Loved it.",
  "Too bitter, needed more milk.",
  "Silky texture with a floral finish.",
  "Nutty and toasty. Comfort in a cup.",
  "Refreshing on a hot day.",
  "Rich and full-bodied. Worth every peso.",
  "Subtle sweetness, not overpowering.",
  "Surprisingly good for a chain cafe.",
  "The oat milk made a huge difference.",
  "Creamy with a clean finish.",
  "Could use a bit more intensity.",
  null, null, null, null, null, null, null, null, // ~30% chance of no note
];

// ---------------------------------------------------------------------------
// Generate entries
// ---------------------------------------------------------------------------

type EntryDef = {
  cafeIdx: number;
  beverageName: string;
  category: string;
  date: Date;
  basePrice: number;
  addOns: { name: string; category: string; price: number }[];
  rating: number;
  personalNotes?: string;
};

function generateEntries(): EntryDef[] {
  const entries: EntryDef[] = [];

  // Spread 125 entries across 180 days (6 months)
  // ~5 drinks per week on average
  for (let i = 0; i < 125; i++) {
    // Random day within the last 180 days, with slight clustering toward recent
    const maxDays = 180;
    const day = Math.floor(Math.random() * Math.random() * maxDays); // clusters toward 0 (recent)

    const cafeIdx = Math.floor(Math.random() * CAFES.length);
    const drink = pick(DRINKS);
    const price = drink.priceRange[0] + Math.floor(Math.random() * (drink.priceRange[1] - drink.priceRange[0]));

    // ~35% chance of having an add-on
    const addOns: { name: string; category: string; price: number }[] = [];
    if (Math.random() < 0.35) {
      addOns.push({ ...pick(ADD_ONS) });
      // ~10% chance of a second add-on
      if (Math.random() < 0.1) {
        addOns.push({ ...pick(ADD_ONS) });
      }
    }

    const note = pick(NOTES);

    entries.push({
      cafeIdx,
      beverageName: drink.name,
      category: drink.category,
      date: daysAgo(day),
      basePrice: price,
      addOns,
      rating: pickRating(),
      ...(note ? { personalNotes: note } : {}),
    });
  }

  // Sort by date descending (most recent first) for readable console output
  entries.sort((a, b) => b.date.getTime() - a.date.getTime());

  return entries;
}

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

  const ENTRY_DEFS = generateEntries();

  console.log(`\n📓  Seeding ${ENTRY_DEFS.length} entries…`);

  let created = 0;
  let skipped = 0;

  for (const def of ENTRY_DEFS) {
    const cafeId = cafeIds[def.cafeIdx];
    const cafeData = CAFES[def.cafeIdx];
    const totalPrice = def.basePrice + def.addOns.reduce((s, a) => s + a.price, 0);

    const result = await Entry.findOneAndUpdate(
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
          addOns: def.addOns,
          totalPrice,
          rating: def.rating,
          tastingNotes: [],
          ...(def.personalNotes ? { personalNotes: def.personalNotes } : {}),
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    // Check if this was a new insert or existing
    if (result.createdAt && Date.now() - new Date(result.createdAt).getTime() < 5000) {
      created++;
    } else {
      skipped++;
    }
  }

  const totalSpent = ENTRY_DEFS.reduce(
    (s, d) => s + d.basePrice + d.addOns.reduce((a, o) => a + o.price, 0),
    0
  );

  // Category breakdown
  const categories: Record<string, number> = {};
  for (const e of ENTRY_DEFS) {
    categories[e.category] = (categories[e.category] || 0) + 1;
  }

  console.log(`\n📊  Category breakdown:`);
  for (const [cat, count] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
    const pct = ((count / ENTRY_DEFS.length) * 100).toFixed(0);
    console.log(`   • ${cat}: ${count} entries (${pct}%)`);
  }

  // Monthly breakdown
  const months: Record<string, number> = {};
  for (const e of ENTRY_DEFS) {
    const key = e.date.toLocaleDateString("en-PH", { year: "numeric", month: "short" });
    months[key] = (months[key] || 0) + 1;
  }

  console.log(`\n📅  Monthly breakdown:`);
  for (const [month, count] of Object.entries(months)) {
    console.log(`   • ${month}: ${count} entries`);
  }

  console.log(
    `\n✅  Done! ${CAFES.length} cafes · ${created} new entries (${skipped} skipped) · ₱${totalSpent.toLocaleString("en-PH")} total spend`
  );
  console.log(`\n💡  This tests: pagination (${ENTRY_DEFS.length} entries > 20 per page), category filters, 6-month analytics chart, and history grouping.`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});