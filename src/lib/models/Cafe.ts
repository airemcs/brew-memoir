import { Schema, model, models, type Document, type Types } from "mongoose";

export interface ICafeDocument extends Document {
  userId: Types.ObjectId;
  name: string;
  address?: string;
  neighborhood?: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CafeSchema = new Schema<ICafeDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    neighborhood: { type: String, trim: true },
    tags: { type: [String], default: [] },
    isFavorite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Each user has their own cafe records; names should be unique per user.
CafeSchema.index({ userId: 1, name: 1 }, { unique: true });

// Cafe stats (totalVisits, totalSpent, lastVisited, peakHour, visitFrequency)
// are computed via aggregation on the Entry collection — not stored here.

const Cafe = models.Cafe ?? model<ICafeDocument>("Cafe", CafeSchema);
export default Cafe;
