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
    monthlyBudget: number; // in PHP, default 10000
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
      monthlyBudget: { type: Number, default: 10_000 },
    },
  },
  { timestamps: true }
);

// Prevent model re-compilation during hot-reload in development.
const User = models.User ?? model<IUserDocument>("User", UserSchema);
export default User;
