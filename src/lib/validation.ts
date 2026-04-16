import { z } from "zod";
import { BEVERAGE_CATEGORIES, ADDON_CATEGORIES, TASTING_NOTES } from "@/types";

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

const objectIdString = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

// ---------------------------------------------------------------------------
// Add-on
// ---------------------------------------------------------------------------

export const AddOnSchema = z.object({
  name: z.string().min(1, "Add-on name is required").max(80),
  category: z.enum(ADDON_CATEGORIES),
  price: z.number().min(0, "Price cannot be negative"),
});

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

export const CreateEntrySchema = z.object({
  cafeName: z.string().min(1, "Cafe name is required").max(120),
  cafeId: objectIdString.optional(),
  cafeCity: z.string().max(120).optional(),
  beverageName: z.string().min(1, "Beverage name is required").max(120),
  category: z.enum(BEVERAGE_CATEGORIES),
  date: z.string().datetime({ message: "Date must be a valid ISO-8601 string" }),
  basePrice: z.number().min(0, "Base price cannot be negative"),
  addOns: z.array(AddOnSchema).default([]),
  photoUrl: z.url("photoUrl must be a valid URL").optional(),
  rating: z.number().min(0.5).max(5).multipleOf(0.5),
  ratingNote: z.string().max(300).optional(),
  flavorIntensity: z.number().int().min(1).max(100).optional(),
  tastingNotes: z.array(z.string().max(60)).default([]),
  personalNotes: z.string().max(1000).optional(),
});

export const UpdateEntrySchema = CreateEntrySchema.partial();

export type CreateEntryInput = z.infer<typeof CreateEntrySchema>;
export type UpdateEntryInput = z.infer<typeof UpdateEntrySchema>;

// ---------------------------------------------------------------------------
// Cafe
// ---------------------------------------------------------------------------

export const CreateCafeSchema = z.object({
  name: z.string().min(1, "Cafe name is required").max(120),
  address: z.string().max(200).optional(),
  neighborhood: z.string().max(120).optional(),
  tags: z.array(z.string().max(40)).default([]),
});

export const UpdateCafeSchema = CreateCafeSchema.partial().extend({
  isFavorite: z.boolean().optional(),
});

export type CreateCafeInput = z.infer<typeof CreateCafeSchema>;
export type UpdateCafeInput = z.infer<typeof UpdateCafeSchema>;

// ---------------------------------------------------------------------------
// User preferences
// ---------------------------------------------------------------------------

const CURRENCY_CODES = ["PHP", "USD", "SGD", "JPY", "EUR", "GBP"] as const;

export const UpdatePreferencesSchema = z.object({
  currency: z.enum(CURRENCY_CODES).optional(),
  defaultCategory: z.enum(BEVERAGE_CATEGORIES).optional(),
  // Subset of the global TASTING_NOTES list the user has pinned as quick-picks
  tastingNotePresets: z.array(z.enum(TASTING_NOTES)).optional(),
  monthlyBudget: z.number().min(0).optional(),
  notificationsOn: z.boolean().optional(),
});

export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesSchema>;

// ---------------------------------------------------------------------------
// Auth (credentials sign-up / sign-in)
// ---------------------------------------------------------------------------

export const SignUpSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
});

export const SignInSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parses an unknown request body against a Zod schema.
 * Returns { data } on success or { error, status: 400 } on failure so
 * Route Handlers can handle validation with a one-liner.
 *
 * Usage:
 *   const parsed = validate(CreateEntrySchema, await req.json());
 *   if ("error" in parsed) return NextResponse.json(parsed, { status: parsed.status });
 *   const { data } = parsed;
 */
export function validate<T>(
  schema: z.ZodType<T>,
  input: unknown
): { data: T } | { error: string; status: 400 } {
  const result = schema.safeParse(input);
  if (!result.success) {
    const message = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    return { error: message, status: 400 };
  }
  return { data: result.data };
}
