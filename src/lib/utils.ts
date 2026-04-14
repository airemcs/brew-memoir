import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// ---------------------------------------------------------------------------
// Password hashing (used by credentials auth)
// Relies on Node's built-in `crypto` — no extra packages needed.
// ---------------------------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [salt, hash] = storedHash.split(":");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  const storedBuffer = Buffer.from(hash, "hex");
  // Use timingSafeEqual to prevent timing attacks
  return timingSafeEqual(derivedKey, storedBuffer);
}

// ---------------------------------------------------------------------------
// Currency formatting — Philippine Peso
// ---------------------------------------------------------------------------

export function formatPHP(amount: number): string {
  return `₱${amount.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Date / time helpers
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatMonthYear(date: Date | string): string {
  const d = new Date(date);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export function formatTime(date: Date | string): string {
  const d = new Date(date);
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  return `${h}:${minutes} ${ampm}`;
}

/**
 * Returns a contextual time-of-day label used in the Entry Detail view.
 * e.g. "MORNING RITUAL", "AFTERNOON BREAK", "EVENING WIND-DOWN"
 */
export function getTimeOfDayLabel(date: Date | string): string {
  const hour = new Date(date).getHours();
  if (hour < 12) return "MORNING RITUAL";
  if (hour < 17) return "AFTERNOON BREAK";
  if (hour < 21) return "EVENING WIND-DOWN";
  return "LATE NIGHT SIP";
}

// ---------------------------------------------------------------------------
// Flavor intensity mapping (1–100 → label)
// ---------------------------------------------------------------------------

export function flavorIntensityLabel(value: number): string {
  if (value <= 20) return "Mellow";
  if (value <= 40) return "Delicate";
  if (value <= 60) return "Balanced";
  if (value <= 80) return "Bold";
  return "Vibrant";
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

export function computeTotalPrice(basePrice: number, addOns: { price: number }[]): number {
  return basePrice + addOns.reduce((sum, a) => sum + a.price, 0);
}
