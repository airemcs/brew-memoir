/**
 * Wipe script — two modes:
 *
 *   npm run wipe            # clears dev user's data only
 *   npm run wipe -- --all   # drops ALL collections (full reset)
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
const ALL = process.argv.includes("--all");

async function wipe() {
  console.log("🔌  Connecting to MongoDB…");
  await mongoose.connect(MONGODB_URI as string);
  console.log("✅  Connected\n");

  if (ALL) {
    console.log("⚠️   Full reset — dropping all collections…");
    const [entries, cafes, users] = await Promise.all([
      Entry.deleteMany({}),
      Cafe.deleteMany({}),
      User.deleteMany({}),
    ]);

    // Also drop NextAuth adapter collections if they exist
    const db = mongoose.connection.db!;
    const collections = await db.listCollections().toArray();
    const authCollections = ["accounts", "sessions", "verification_tokens"];
    for (const name of authCollections) {
      if (collections.some((c) => c.name === name)) {
        await db.collection(name).deleteMany({});
        console.log(`🗑️   Cleared ${name}`);
      }
    }

    console.log(`🗑️   Deleted ${entries.deletedCount} entries`);
    console.log(`🗑️   Deleted ${cafes.deletedCount} cafes`);
    console.log(`🗑️   Deleted ${users.deletedCount} users`);
    console.log("\n✅  Full reset complete.");
  } else {
    const [entries, cafes] = await Promise.all([
      Entry.deleteMany({ userId: DEV_USER_ID }),
      Cafe.deleteMany({ userId: DEV_USER_ID }),
      User.deleteOne({ _id: DEV_USER_ID }),
    ]);

    console.log(`🗑️   Deleted ${entries.deletedCount} entries`);
    console.log(`🗑️   Deleted ${cafes.deletedCount} cafes`);
    console.log(`🗑️   Deleted dev user`);
    console.log("\n✅  Dev user wiped.");
  }

  await mongoose.disconnect();
}

wipe().catch((err) => {
  console.error("❌  Wipe failed:", err);
  process.exit(1);
});
