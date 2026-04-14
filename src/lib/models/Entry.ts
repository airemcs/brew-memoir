import mongoose, { Schema, model, models, type Document, type Types } from "mongoose";
import type { BeverageCategory, AddOnCategory } from "@/types";
import { BEVERAGE_CATEGORIES, ADDON_CATEGORIES } from "@/types";

export interface IAddOn {
  name: string;
  category: AddOnCategory;
  price: number;
}

export interface IEntryDocument extends Document {
  userId: Types.ObjectId;
  cafeName: string;
  cafeId?: Types.ObjectId;
  beverageName: string;
  category: BeverageCategory;
  date: Date;
  basePrice: number;
  addOns: IAddOn[];
  totalPrice: number;
  photoUrl?: string;
  rating: number;
  ratingNote?: string;
  flavorIntensity?: number;
  tastingNotes: string[];
  personalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AddOnSchema = new Schema<IAddOn>(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ADDON_CATEGORIES as unknown as string[],
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const EntrySchema = new Schema<IEntryDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    cafeName: { type: String, required: true, trim: true },
    cafeId: { type: Schema.Types.ObjectId, ref: "Cafe" },
    beverageName: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: BEVERAGE_CATEGORIES as unknown as string[],
      required: true,
    },
    date: { type: Date, required: true },
    basePrice: { type: Number, required: true, min: 0 },
    addOns: { type: [AddOnSchema], default: [] },
    totalPrice: { type: Number, required: true, min: 0 },
    photoUrl: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    ratingNote: { type: String },
    // 1–100 scale, mapped to Mellow→Vibrant on the slider
    flavorIntensity: { type: Number, min: 1, max: 100 },
    tastingNotes: { type: [String], default: [] },
    personalNotes: { type: String },
  },
  { timestamps: true }
);

// Compound index for efficient per-user queries sorted by date
EntrySchema.index({ userId: 1, date: -1 });
EntrySchema.index({ userId: 1, cafeId: 1 });
EntrySchema.index({ userId: 1, category: 1 });

// Auto-calculate totalPrice before saving
EntrySchema.pre("save", async function () {
  const addOnTotal = this.addOns.reduce((sum, a) => sum + a.price, 0);
  this.totalPrice = this.basePrice + addOnTotal;
});

const Entry = models.Entry ?? model<IEntryDocument>("Entry", EntrySchema);
export default Entry;
