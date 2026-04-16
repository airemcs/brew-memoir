/**
 * Wipe script — deletes all data for the dev user without re-seeding.
 *
 * Usage:
 *   npm run wipe
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import mongoose, { Types } from "mongoose";
import Entry from "../src/lib/models/Entry";
import Cafe from "../src/lib/models/Cafe";
import User from "../src/lib/models/User";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI not found in .env.local");
  process.exit(1);
}

const DEV_USER_ID = new Types.ObjectId("000000000000000000000001");

async function wipe() {
  console.log("🔌  Connecting to MongoDB…");
  await mongoose.connect(MONGODB_URI as string);
  console.log("✅  Connected\n");

  const [entries, cafes] = await Promise.all([
    Entry.deleteMany({ userId: DEV_USER_ID }),
    Cafe.deleteMany({ userId: DEV_USER_ID }),
    User.deleteOne({ _id: DEV_USER_ID }),
  ]);

  console.log(`🗑️   Deleted ${entries.deletedCount} entries`);
  console.log(`🗑️   Deleted ${cafes.deletedCount} cafes`);
  console.log(`🗑️   Deleted dev user`);
  console.log("\n✅  Database wiped.");

  await mongoose.disconnect();
}

wipe().catch((err) => {
  console.error("❌  Wipe failed:", err);
  process.exit(1);
});
