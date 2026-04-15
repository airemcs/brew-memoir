import type { Types } from "mongoose";

// ---------------------------------------------------------------------------
// Enums / constants
// ---------------------------------------------------------------------------

export const BEVERAGE_CATEGORIES = [
  "Coffee",
  "Espresso & Milk",
  "Matcha",
  "Hojicha",
  "Tea",
  "Chocolate",
  "Frappe & Blended",
  "Fruit & Refresher",
  "Specialty",
] as const;

export type BeverageCategory = (typeof BEVERAGE_CATEGORIES)[number];

export const ADDON_CATEGORIES = [
  "alternative",
  "intensity",
  "syrup",
  "temperature",
  "topping",
  "size",
  "customization",
] as const;

export type AddOnCategory = (typeof ADDON_CATEGORIES)[number];

export const AUTH_PROVIDERS = ["google", "credentials"] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

export const TASTING_NOTES = [
  "Caramel",
  "Nutty",
  "Floral",
  "Fruity",
  "Chocolatey",
  "Earthy",
  "Spicy",
  "Smoky",
  "Citrus",
  "Berry",
  "Honey",
  "Vanilla",
  "Creamy",
  "Umami",
  "Vegetal",
  "Herbal",
  "Malty",
  "Toasty",
  "Bright",
  "Clean",
] as const;

export type TastingNote = (typeof TASTING_NOTES)[number];

// ---------------------------------------------------------------------------
// Domain types (plain objects — safe to pass to Client Components)
// ---------------------------------------------------------------------------

export interface AddOn {
  name: string;
  category: AddOnCategory;
  price: number;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  image?: string;
  authProvider: AuthProvider;
  createdAt: string;
  updatedAt: string;
}

export interface IEntry {
  _id: string;
  userId: string;
  cafeName: string;
  cafeId?: string;
  cafeCity?: string;
  beverageName: string;
  category: BeverageCategory;
  date: string;
  basePrice: number;
  addOns: AddOn[];
  totalPrice: number;
  photoUrl?: string;
  rating: number;
  ratingNote?: string;
  flavorIntensity?: number;
  tastingNotes: string[];
  personalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICafe {
  _id: string;
  userId: string;
  name: string;
  address?: string;
  neighborhood?: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

// Computed stats returned from aggregation — not stored in DB
export interface CafeStats {
  totalVisits: number;
  totalSpent: number;
  lastVisited?: string;
  averageRating?: number;
  peakHour?: number; // 0–23
  visitsByDayOfWeek?: number[]; // index 0 = Sunday
}

export interface ICafeWithStats extends ICafe {
  stats: CafeStats;
}

// ---------------------------------------------------------------------------
// Analytics types
// ---------------------------------------------------------------------------

export interface MonthlySpending {
  year: number;
  month: number; // 1–12
  total: number;
  count: number;
}

export interface CategoryBreakdown {
  category: BeverageCategory;
  count: number;
  total: number;
  percentage: number;
}

export interface OverviewStats {
  currentMonth: {
    totalSpent: number;
    totalDrinks: number;
    averagePerDrink: number;
    topChoices: string[];
    categoryBreakdown: CategoryBreakdown[];
  };
  allTime: {
    totalSpent: number;
    totalDrinks: number;
    favoriteCafe?: string;
    favoriteCategory?: BeverageCategory;
    averageRating: number;
  };
}

// ---------------------------------------------------------------------------
// API request/response shapes
// ---------------------------------------------------------------------------

export interface CreateEntryInput {
  cafeName: string;
  cafeId?: string;
  cafeCity?: string;
  beverageName: string;
  category: BeverageCategory;
  date: string;
  basePrice: number;
  addOns: AddOn[];
  photoUrl?: string;
  rating: number;
  ratingNote?: string;
  flavorIntensity?: number;
  tastingNotes: string[];
  personalNotes?: string;
}

export type UpdateEntryInput = Partial<CreateEntryInput>;

export interface CreateCafeInput {
  name: string;
  address?: string;
  neighborhood?: string;
  tags?: string[];
}

export type UpdateCafeInput = Partial<CreateCafeInput> & { isFavorite?: boolean };

export interface ApiError {
  error: string;
}
