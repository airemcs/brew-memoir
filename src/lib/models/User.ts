import { Schema, model, models, type Document } from "mongoose";
import type { AuthProvider } from "@/types";

export interface IUserDocument extends Document {
  name: string;
  email: string;
  image?: string;
  authProvider: AuthProvider;
  // Only set for credentials-provider accounts; never exposed to the client.
  passwordHash?: string;
  preferences: {
    monthlyBudget: number; // in PHP, default 2000
    currency: string;      // ISO 4217 code, default "PHP"
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    image: { type: String },
    authProvider: {
      type: String,
      enum: ["google", "credentials"] satisfies AuthProvider[],
      required: true,
    },
    passwordHash: { type: String, select: false }, // excluded from queries by default
    preferences: {
      monthlyBudget: { type: Number, default: 2_000 },
      currency: { type: String, default: "PHP" },
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
//
// email already has { unique: true } declared on the field, which creates an
// index automatically. Explicitly add it here for clarity and to set
// collation so lookups are case-insensitive without a toLowerCase() call.
// The CredentialsProvider already lowercases on input, so this is belt-and-
// suspenders for any future direct lookups.
UserSchema.index({ email: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });

// Prevent model re-compilation during hot-reload in development.
const User = models.User ?? model<IUserDocument>("User", UserSchema);
export default User;
