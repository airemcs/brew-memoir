import Link from "next/link";
import { notFound } from "next/navigation";
import { Types } from "mongoose";
import type { BeverageCategory, IBranch, IEntry } from "@/types";
import { connectDB } from "@/lib/db";
import { Cafe, Entry } from "@/lib/models";
import { getServerUserId } from "@/lib/serverAuth";
import CafeDetailHeader from "./CafeDetailHeader";

// ---------------------------------------------------------------------------
// Data layer
// ---------------------------------------------------------------------------

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

interface CafeDetail {
  _id: string;
  name: string;
  address: string;
  neighborhood: string;
  branches: IBranch[];
  totalSpent: number;
  totalVisits: number;
  averageRating: number | null;
  visitsByDay: [number, number, number, number, number, number, number];
  weeklyAverage: number;
  entries: (IEntry & { displayDate: string })[];
}

async function getCafe(id: string): Promise<CafeDetail | null> {
  if (!Types.ObjectId.isValid(id)) return null;

  const userId = await getServerUserId();
  if (!userId) return null;

  await connectDB();
  const userObjectId = new Types.ObjectId(userId);
  const cafeObjectId = new Types.ObjectId(id);

  const cafe = await Cafe.findOne({ _id: cafeObjectId, userId: userObjectId }).lean();
  if (!cafe) return null;

  // Summary stats
  const [summary] = await Entry.aggregate([
    { $match: { userId: userObjectId, cafeId: cafeObjectId } },
    {
      $group: {
        _id: null,
        totalVisits: { $sum: 1 },
        totalSpent: { $sum: "$totalPrice" },
        averageRating: { $avg: "$rating" },
        firstVisit: { $min: "$date" },
      },
    },
  ]);

  const totalVisits: number = summary?.totalVisits ?? 0;
  const totalSpent: number = summary?.totalSpent ?? 0;
  const averageRating: number | null = summary?.averageRating != null
    ? Math.round(summary.averageRating * 10) / 10
    : null;

  // weeklyAverage — distinct ISO weeks with at least one visit, then visits / weeks
  const weekAgg = await Entry.aggregate([
    { $match: { userId: userObjectId, cafeId: cafeObjectId } },
    {
      $group: {
        _id: {
          isoWeek: { $isoWeek: "$date" },
          isoWeekYear: { $isoWeekYear: "$date" },
        },
      },
    },
    { $count: "distinctWeeks" },
  ]);
  const distinctWeeks: number = weekAgg[0]?.distinctWeeks ?? 0;
  const weeklyAverage = distinctWeeks > 0
    ? Math.round((totalVisits / distinctWeeks) * 10) / 10
    : 0;

  // visitsByDay[7] (0=Mon … 6=Sun)
  // $dayOfWeek: 1=Sun … 7=Sat → remap: Sun→6, Mon→0, …, Sat→5
  const dayAgg = await Entry.aggregate([
    { $match: { userId: userObjectId, cafeId: cafeObjectId } },
    { $group: { _id: { $dayOfWeek: "$date" }, count: { $sum: 1 } } },
  ]);

  const visitsByDay: [number, number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0, 0];
  for (const { _id, count } of dayAgg) {
    visitsByDay[_id === 1 ? 6 : _id - 2] = count;
  }

  // Brew history entries
  const rawEntries = await Entry.find({ userId: userObjectId, cafeId: cafeObjectId })
    .sort({ date: -1 })
    .limit(20)
    .lean();

  const entries: (IEntry & { displayDate: string })[] = JSON.parse(JSON.stringify(rawEntries)).map(
    (e: IEntry) => ({
      ...e,
      displayDate: new Date(e.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    })
  );

  return {
    _id: cafe._id.toString(),
    name: cafe.name,
    address: cafe.address ?? "",
    neighborhood: cafe.neighborhood ?? cafe.address ?? "",
    branches: JSON.parse(JSON.stringify(cafe.branches ?? [])),
    totalSpent,
    totalVisits,
    averageRating,
    visitsByDay,
    weeklyAverage,
    entries,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(amount: number): string {
  return amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const CATEGORY_ICON: Record<BeverageCategory, string> = {
  Coffee: "coffee",
  "Espresso & Milk": "coffee_maker",
  Matcha: "eco",
  Hojicha: "potted_plant",
  Tea: "water_drop",
  Chocolate: "icecream",
  "Frappe & Blended": "local_drink",
  "Fruit & Refresher": "blender",
  "Milk Tea": "emoji_food_beverage",
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-primary">
      {Array.from({ length: 5 }, (_, i) => {
        const full = rating >= i + 1;
        const half = !full && rating >= i + 0.5;
        return (
          <span key={i} className={`material-symbols-outlined text-[0.65rem]${full ? " filled" : ""}`}>
            {full ? "star" : half ? "star_half" : "star"}
          </span>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

export default async function CafeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cafe = await getCafe(id);
  if (!cafe) notFound();

  const maxVisits = Math.max(...cafe.visitsByDay);

  return (
    <>
      {/* ── Top App Bar ── */}
      <CafeDetailHeader cafeId={cafe._id} totalEntries={cafe.totalVisits} />

      {/* ── Main ── */}
      <main className="pb-32 px-6 max-w-2xl mx-auto">

        {/* Sticky cafe name */}
        <section className="sticky top-0 z-40 bg-surface pt-6 pb-4 -mx-6 px-6 border-b border-outline-variant/10">
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-1">{cafe.name}</h2>
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">location_on</span>
            <p className="text-sm font-medium">{cafe.address}</p>
          </div>
        </section>

        {/* Metric Cards */}
        <section className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-surface-container-low p-5 rounded-2xl">
            <p className="text-[0.625rem] uppercase tracking-wide font-bold text-on-surface-variant mb-2">
              Total Investment
            </p>
            <p className="text-2xl font-extrabold tracking-tight text-primary">
              ₱{formatPrice(cafe.totalSpent)}
            </p>
          </div>
          <div className="bg-surface-container-low p-5 rounded-2xl">
            <p className="text-[0.625rem] uppercase tracking-wide font-bold text-on-surface-variant mb-2">
              Total Visits
            </p>
            <p className="text-2xl font-extrabold tracking-tight text-primary">
              {cafe.totalVisits} Visits
            </p>
          </div>
          {cafe.averageRating !== null && (
            <div className="col-span-2 bg-surface-container-low p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[0.625rem] uppercase tracking-wide font-bold text-on-surface-variant mb-2">
                  Avg. Order Rating
                </p>
                <div className="flex items-center gap-2">
                  <Stars rating={cafe.averageRating} />
                  <span className="text-sm font-bold text-on-surface">{cafe.averageRating} / 5</span>
                </div>
              </div>
              <span className="text-4xl font-extralight text-primary">{cafe.averageRating}</span>
            </div>
          )}
        </section>

        {/* Visit Frequency Trend */}
        <section className="mb-8">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-[0.625rem] uppercase tracking-wide font-bold text-on-surface-variant mb-1">
                Visit Frequency Trend
              </h3>
              <p className="text-sm text-on-surface-variant">Patterns across the week</p>
            </div>
            <div className="text-right">
              {/* Replace with: computed from GET /api/cafes/:id/stats */}
              <p className="text-xl font-extrabold text-primary">{cafe.weeklyAverage} / week</p>
            </div>
          </div>
          <div className="bg-surface-container-low p-6 rounded-2xl flex items-end justify-between gap-2" style={{ height: "11rem" }}>
            {cafe.visitsByDay.map((count, i) => {
              const heightPct = maxVisits > 0 ? (count / maxVisits) * 100 : 0;
              const isPeak = count === maxVisits && count > 0;
              return (
                <div key={i} className="flex flex-col items-center flex-1 gap-2 h-full justify-end">
                  <span className={`text-[0.5625rem] font-bold ${isPeak ? "text-primary" : "text-on-surface-variant/50"}`}>
                    {count > 0 ? count : ""}
                  </span>
                  <div
                    className={`w-full rounded-t-sm ${isPeak ? "bg-primary" : "bg-surface-container-high"}`}
                    style={{ height: `${Math.max(heightPct, count > 0 ? 6 : 0)}%` }}
                  />
                  <span className={`text-[0.5625rem] font-semibold uppercase tracking-wide ${isPeak ? "text-primary" : "text-outline"}`}>
                    {DAYS[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Brew History */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[0.625rem] uppercase tracking-wide font-bold text-on-surface-variant">
              Brew History
            </h3>
            <Link href="/profile/history" className="text-[0.625rem] font-bold text-primary">
              View All
            </Link>
          </div>
          <div className="flex flex-col gap-6">
            {/* Replace with: GET /api/cafes/:id/entries */}
            {cafe.entries.map((entry) => (
              <Link key={entry._id} href={`/entry/${entry._id}`} className="flex items-start gap-4 group">
                <div className="w-12 h-12 bg-secondary-container rounded-xl flex items-center justify-center shrink-0 group-hover:scale-95 transition-transform">
                  <span className="material-symbols-outlined text-on-secondary-container text-2xl">
                    {CATEGORY_ICON[entry.category]}
                  </span>
                </div>
                <div className="flex-1 min-w-0 flex justify-between items-start gap-2">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-bold text-on-surface">{entry.beverageName}</h4>
                    <Stars rating={entry.rating} />
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold text-on-surface">₱{formatPrice(entry.totalPrice)}</span>
                    <p className="text-[0.625rem] text-on-surface-variant mt-0.5">{entry.displayDate}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Branches */}
        {cafe.branches.length > 0 && (
          <section className="mb-8">
            <h3 className="text-[0.625rem] uppercase tracking-wide font-bold text-on-surface-variant mb-4">
              Locations
            </h3>
            <div className="flex flex-col gap-2">
              {cafe.branches.map((branch) => (
                <div key={branch._id} className="flex items-center gap-3 p-4 bg-surface-container-low rounded-xl">
                  <span className="material-symbols-outlined text-primary text-lg">location_on</span>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{branch.label}</p>
                    {branch.city && (
                      <p className="text-xs text-on-surface-variant">{branch.city}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Location */}
        <section className="mb-8">
          <h3 className="text-[0.625rem] uppercase tracking-wide font-bold text-on-surface-variant mb-6">
            Location & Directions
          </h3>
          <div className="bg-surface-container-low rounded-2xl overflow-hidden">
            <div className="h-48 w-full relative overflow-hidden">
              {/* Replace with: dynamic map via Mapbox/Google Maps — swap this SVG for a real tile */}
              <svg
                viewBox="0 0 400 192"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
              >
                {/* Base land */}
                <rect width="400" height="192" fill="#e8e4de" />

                {/* City blocks */}
                <rect x="0"   y="0"   width="80"  height="55"  fill="#ddd8d0" />
                <rect x="90"  y="0"   width="60"  height="55"  fill="#ddd8d0" />
                <rect x="160" y="0"   width="90"  height="55"  fill="#ddd8d0" />
                <rect x="260" y="0"   width="70"  height="55"  fill="#ddd8d0" />
                <rect x="340" y="0"   width="60"  height="55"  fill="#ddd8d0" />

                <rect x="0"   y="70"  width="55"  height="60"  fill="#ddd8d0" />
                <rect x="65"  y="70"  width="75"  height="60"  fill="#ddd8d0" />
                <rect x="150" y="70"  width="50"  height="60"  fill="#ddd8d0" />
                <rect x="210" y="70"  width="80"  height="60"  fill="#ddd8d0" />
                <rect x="300" y="70"  width="100" height="60"  fill="#ddd8d0" />

                <rect x="0"   y="145" width="70"  height="47"  fill="#ddd8d0" />
                <rect x="80"  y="145" width="90"  height="47"  fill="#ddd8d0" />
                <rect x="180" y="145" width="60"  height="47"  fill="#ddd8d0" />
                <rect x="250" y="145" width="80"  height="47"  fill="#ddd8d0" />
                <rect x="340" y="145" width="60"  height="47"  fill="#ddd8d0" />

                {/* Park / green area */}
                <rect x="90"  y="0"   width="60"  height="55"  fill="#d4e0c8" opacity="0.6" />
                <rect x="65"  y="70"  width="75"  height="60"  fill="#d4e0c8" opacity="0.4" />

                {/* Major roads (thick) */}
                <rect x="0"   y="60"  width="400" height="10"  fill="#ffffff" />
                <rect x="0"   y="133" width="400" height="10"  fill="#ffffff" />
                <rect x="83"  y="0"   width="8"   height="192" fill="#ffffff" />
                <rect x="203" y="0"   width="8"   height="192" fill="#ffffff" />
                <rect x="333" y="0"   width="8"   height="192" fill="#ffffff" />

                {/* Minor roads (thin) */}
                <rect x="0"   y="64"  width="400" height="2"   fill="#f0ece6" />
                <rect x="0"   y="137" width="400" height="2"   fill="#f0ece6" />
                <rect x="87"  y="0"   width="2"   height="192" fill="#f0ece6" />
                <rect x="207" y="0"   width="2"   height="192" fill="#f0ece6" />
                <rect x="337" y="0"   width="2"   height="192" fill="#f0ece6" />

                {/* Diagonal accent road */}
                <line x1="0" y1="192" x2="160" y2="0" stroke="#ffffff" strokeWidth="7" />
                <line x1="0" y1="192" x2="160" y2="0" stroke="#f0ece6" strokeWidth="2" />

                {/* Road labels (tiny) */}
                <text x="92" y="57" fontSize="5" fill="#b0a89e" fontFamily="sans-serif" transform="rotate(-90,92,57)" textAnchor="middle">Salcedo St</text>
                <text x="207" y="57" fontSize="5" fill="#b0a89e" fontFamily="sans-serif" transform="rotate(-90,207,57)" textAnchor="middle">Leviste St</text>
                <text x="200" y="68" fontSize="5" fill="#b0a89e" fontFamily="sans-serif">V.A. Rufino</text>
                <text x="200" y="141" fontSize="5" fill="#b0a89e" fontFamily="sans-serif">Valero St</text>

                {/* Subtle vignette overlay */}
                <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="100%" stopColor="#e8e4de" stopOpacity="0.5" />
                </radialGradient>
                <rect width="400" height="192" fill="url(#vignette)" />
              </svg>

              {/* Pin */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-primary rounded-full border-4 border-surface shadow-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xl filled">location_on</span>
                  </div>
                  <div className="w-2 h-2 bg-primary/30 rounded-full mt-0.5 blur-sm" />
                </div>
              </div>
            </div>
            <div className="p-5">
              <button className="w-full py-3.5 bg-linear-to-r from-primary to-primary-dim text-on-primary font-bold rounded-xl active:scale-[0.98] transition-transform duration-200 flex items-center justify-center gap-2 text-sm">
                <span className="material-symbols-outlined text-sm">map</span>
                Open in Maps
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* ── FAB ── */}
      <Link
        href="/entry/new"
        aria-label="Add new entry"
        className="fixed bottom-20 right-6 w-12 h-12 bg-primary text-on-primary rounded-xl shadow-xl flex items-center justify-center active:scale-90 transition-transform duration-150 z-50 md:bottom-6"
      >
        <span className="material-symbols-outlined text-2xl">add</span>
      </Link>

      {/* ── Bottom Nav (mobile) ── */}
      <nav
        aria-label="Main navigation"
        className="md:hidden fixed bottom-0 left-0 w-full bg-surface/90 backdrop-blur-xl flex justify-around items-center px-2 py-2 z-50 shadow-[0_-4px_16px_rgba(48,51,49,0.04)]"
      >
        <Link href="/" className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary transition-all">
          <span className="material-symbols-outlined text-xl">menu_book</span>
          <span className="text-[9px] uppercase tracking-widest font-medium mt-0.5">Journal</span>
        </Link>
        <Link href="/cafes" className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-lg px-3 py-1 transition-all">
          <span className="material-symbols-outlined text-xl">store</span>
          <span className="text-[9px] uppercase tracking-widest font-bold mt-0.5">Cafes</span>
        </Link>
        <Link href="/profile/history" className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary transition-all">
          <span className="material-symbols-outlined text-xl">history</span>
          <span className="text-[9px] uppercase tracking-widest font-medium mt-0.5">History</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary transition-all">
          <span className="material-symbols-outlined text-xl">person</span>
          <span className="text-[9px] uppercase tracking-widest font-medium mt-0.5">Profile</span>
        </Link>
      </nav>
    </>
  );
}
