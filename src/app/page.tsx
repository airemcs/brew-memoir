import Link from "next/link";
import { Types } from "mongoose";
import type { BeverageCategory, IEntry } from "@/types";
import { connectDB } from "@/lib/db";
import { Entry, Cafe, User } from "@/lib/models";
import { getServerUserId } from "@/lib/serverAuth";

// ---------------------------------------------------------------------------
// Data layer
// ---------------------------------------------------------------------------

function computeDisplayDate(dateStr: string): string {
  const d = new Date(dateStr);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Boundaries for the last 5 ISO weeks (Mon–Sun), oldest first
function buildWeekSlots(): { start: Date; end: Date }[] {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const currentMonStart = new Date(now);
  currentMonStart.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  currentMonStart.setHours(0, 0, 0, 0);

  return Array.from({ length: 5 }, (_, i) => {
    const start = new Date(currentMonStart);
    start.setDate(start.getDate() - (4 - i) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  });
}

interface HomeData {
  monthlySpent: number;
  budgetAmount: number;
  totalDrinksThisMonth: number;
  categoryBreakdown: { category: BeverageCategory; count: number; total: number; percentage: number }[];
  mostVisited: { name: string; neighborhood: string; visits: number; mapPhotoUrl: string | null } | null;
  weeklyAverage: number;
  weeklyTrend: [number, number, number, number, number];
  recentEntries: (IEntry & { displayDate: string })[];
}

async function getHomeData(): Promise<HomeData> {
  const userId = await getServerUserId();
  if (!userId) {
    return {
      monthlySpent: 0,
      budgetAmount: 2_000,
      totalDrinksThisMonth: 0,
      categoryBreakdown: [],
      mostVisited: null as HomeData["mostVisited"],
      weeklyAverage: 0,
      weeklyTrend: [0, 0, 0, 0, 0],
      recentEntries: [],
    };
  }

  await connectDB();
  const userObjectId = new Types.ObjectId(userId);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekSlots = buildWeekSlots();
  const fiveWeeksAgo = weekSlots[0].start;

  // Run all aggregations in parallel
  const [monthlyAgg, categoryAgg, mostVisitedAgg, weeklyAgg, recent, userDoc] = await Promise.all([
    // 1. This month total
    Entry.aggregate([
      { $match: { userId: userObjectId, date: { $gte: startOfMonth } } },
      { $group: { _id: null, totalSpent: { $sum: "$totalPrice" }, count: { $sum: 1 } } },
    ]),

    // 2. Category breakdown this month
    Entry.aggregate([
      { $match: { userId: userObjectId, date: { $gte: startOfMonth } } },
      { $group: { _id: "$category", count: { $sum: 1 }, total: { $sum: "$totalPrice" } } },
      { $sort: { count: -1 } },
    ]),

    // 3. Most visited cafe this month
    Entry.aggregate([
      { $match: { userId: userObjectId, date: { $gte: startOfMonth } } },
      { $group: { _id: "$cafeId", visits: { $sum: 1 }, cafeName: { $first: "$cafeName" } } },
      { $sort: { visits: -1 } },
      { $limit: 1 },
    ]),

    // 4. Weekly spend for last 5 weeks
    Entry.aggregate([
      { $match: { userId: userObjectId, date: { $gte: fiveWeeksAgo } } },
      {
        $group: {
          _id: {
            isoWeek: { $isoWeek: "$date" },
            isoWeekYear: { $isoWeekYear: "$date" },
          },
          total: { $sum: "$totalPrice" },
        },
      },
    ]),

    // 5. This month's entries
    Entry.find({ userId: userObjectId, date: { $gte: startOfMonth } }).sort({ date: -1 }).lean(),

    // 6. User preferences
    User.findById(userObjectId).select("preferences").lean(),
  ]);

  // Monthly stats
  const monthlySpent: number = monthlyAgg[0]?.totalSpent ?? 0;
  const totalDrinksThisMonth: number = monthlyAgg[0]?.count ?? 0;
  const budgetAmount: number =
    (userDoc as { preferences?: { monthlyBudget?: number } } | null)
      ?.preferences?.monthlyBudget ?? 2_000;

  // Category breakdown
  const totalDrinksForPct = categoryAgg.reduce((s: number, r: { count: number }) => s + r.count, 0);
  const categoryBreakdown = categoryAgg.slice(0, 3).map((r: { _id: BeverageCategory; count: number; total: number }) => ({
    category: r._id,
    count: r.count,
    total: r.total,
    percentage: totalDrinksForPct > 0 ? Math.round((r.count / totalDrinksForPct) * 100) : 0,
  }));

  // Most visited — look up the Cafe document directly for its canonical address
  const MOST_VISITED_TINT = "https://lh3.googleusercontent.com/aida-public/AB6AXuCDaO9DEjvQ9XZvAsT42ZUKuZ8cqyFBoOblLVt2lsVCvw5b-1T0IJKePJkD0Il9zITvC24Mu6rkg4kixItqEH5CXK5KGGxA5zNfup_Unqz0bY5owjIWEcEVMq5M5IyC29435rQp1xEzhh-8z5tZtWcnTE4_iveQkp2ZsFGv96pPblYW3_eWdPrbYuWIkGtaqoVZ_HXdsGOJHTdoZ6W4EwLSHXiafwydwehEvO_eliBPoCiY1lFA8D7uCsnejJUoAKAevmZtft6vwik";
  let mostVisited: HomeData["mostVisited"] = null;
  if (mostVisitedAgg[0]) {
    const cafeDoc = mostVisitedAgg[0]._id
      ? await Cafe.findById(mostVisitedAgg[0]._id).lean()
      : null;
    mostVisited = {
      name: mostVisitedAgg[0].cafeName as string,
      neighborhood: ((cafeDoc?.address ?? cafeDoc?.neighborhood ?? "") as string).split(",")[0].trim(),
      visits: mostVisitedAgg[0].visits as number,
      mapPhotoUrl: MOST_VISITED_TINT,
    };
  }

  // Weekly trend — map aggregate results to 5 slots
  const weeklyMap = new Map<string, number>();
  for (const row of weeklyAgg) {
    const key = `${row._id.isoWeekYear}-${row._id.isoWeek}`;
    weeklyMap.set(key, row.total);
  }

  function getISOWeekKey(date: Date): string {
    // ISO 8601: find the Thursday of the week, then derive year and week number
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7)); // shift to Thursday
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const isoWeek = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
    return `${d.getUTCFullYear()}-${isoWeek}`;
  }

  const slotTotals = weekSlots.map(({ start }) =>
    weeklyMap.get(getISOWeekKey(start)) ?? 0
  );

  const maxSlot = Math.max(...slotTotals, 1);
  // Normalize to 0–1; give empty weeks a 0.05 floor so they're visible
  const weeklyTrend = slotTotals.map((v) =>
    v > 0 ? v / maxSlot : 0.05
  ) as [number, number, number, number, number];

  const totalWeeklySpend = slotTotals.reduce((s, v) => s + v, 0);
  const nonZeroWeeks = slotTotals.filter((v) => v > 0).length;
  const weeklyAverage = nonZeroWeeks > 0 ? Math.round((totalWeeklySpend / nonZeroWeeks) * 100) / 100 : 0;

  // Recent entries — serialize ObjectIds/Dates via JSON round-trip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentEntries = (recent as any[]).map((e) => ({
    ...JSON.parse(JSON.stringify(e)),
    displayDate: computeDisplayDate(e.date),
  })) as (IEntry & { displayDate: string })[];

  return { monthlySpent, budgetAmount, totalDrinksThisMonth, categoryBreakdown, mostVisited, weeklyAverage, weeklyTrend, recentEntries };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(amount: number, decimals = 0): string {
  return amount.toLocaleString("en-PH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

const CATEGORY_ICON: Record<BeverageCategory, string> = {
  Coffee: "coffee",
  "Espresso & Milk": "coffee",
  Matcha: "eco",
  Hojicha: "potted_plant",
  Tea: "water_drop",
  Chocolate: "coffee",
  "Frappe & Blended": "local_drink",
  "Fruit & Refresher": "local_drink",
  Specialty: "local_cafe",
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-primary">
      {Array.from({ length: 5 }, (_, i) => {
        const full = rating >= i + 1;
        const half = !full && rating >= i + 0.5;
        return (
          <span
            key={i}
            className={`material-symbols-outlined text-sm${full ? " filled" : ""}`}
          >
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

export default async function HomePage() {
  const data = await getHomeData();

  const budgetExceeded = data.monthlySpent > data.budgetAmount;
  const budgetPercentRaw = data.budgetAmount > 0 ? Math.round((data.monthlySpent / data.budgetAmount) * 100) : 0;
  const budgetPercent = Math.min(100, budgetPercentRaw);

  return (
    <>
      {/* ── Top App Bar ── */}
      <header className="fixed top-0 left-0 w-full z-50 bg-surface flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">local_cafe</span>
          <h1 className="text-base font-bold tracking-[-0.02em] text-primary">Brew Memoir</h1>
        </div>

        <nav className="hidden md:flex gap-6 items-center">
          <Link href="/" className="text-primary text-[10px] uppercase tracking-widest">
            Journal
          </Link>
          <Link
            href="/cafes"
            className="text-on-surface-variant text-[10px] uppercase tracking-widest hover:text-primary transition-colors"
          >
            Cafes
          </Link>
          <Link
            href="/profile/history"
            className="text-on-surface-variant text-[10px] uppercase tracking-widest hover:text-primary transition-colors"
          >
            History
          </Link>
          <Link
            href="/profile"
            className="text-on-surface-variant text-[10px] uppercase tracking-widest hover:text-primary transition-colors"
          >
            Profile
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/entry/new"
            className="hidden md:flex items-center gap-1.5 bg-primary text-on-primary px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-primary-dim active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Log
          </Link>
          <button
            aria-label="Notifications"
            className="material-symbols-outlined text-on-surface-variant p-1.5 hover:bg-surface-container rounded-full transition-colors text-xl"
          >
            notifications
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="pt-16 pb-32 px-6 max-w-5xl mx-auto space-y-6">

        {/* Monthly Spend Budget */}
        <section className="space-y-4 pt-6">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-[10px] font-medium uppercase tracking-widest text-on-surface-variant">
                Monthly Spend
              </span>
              <h2 className="text-4xl font-extrabold tracking-tight text-on-background">
                ₱{formatPrice(data.monthlySpent)}
              </h2>
            </div>
            <div className="text-right">
              <span className={`text-[10px] font-medium uppercase tracking-widest ${budgetExceeded ? "text-error" : "text-primary"}`}>
                Budget Status
              </span>
              <p className={`text-sm font-semibold ${budgetExceeded ? "text-error" : "text-on-surface-variant"}`}>
                {budgetPercentRaw}% Consumed
              </p>
            </div>
          </div>
          <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${budgetExceeded ? "bg-error" : "bg-linear-to-r from-primary to-primary-dim"}`}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>
        </section>

        {/* Bento Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Most Visited */}
          <div className="bg-surface-container-low rounded-xl p-5 flex flex-col justify-between aspect-square relative overflow-hidden">
            {/* Always-on tint — replaced by a real mapPhotoUrl once backend provides it */}
            {data.mostVisited?.mapPhotoUrl ? (
              <div className="absolute inset-0 opacity-10">
                <img
                  src={data.mostVisited.mapPhotoUrl}
                  alt="Location map"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="absolute inset-0 bg-linear-to-br from-secondary/15 via-transparent to-primary/10 pointer-events-none" />
            )}
            <div className="relative z-10">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                Most Visited
              </h3>
              <div className="inline-flex items-center gap-1.5 bg-secondary-container pl-1.5 pr-2 py-1 rounded-full max-w-full">
                <span className="material-symbols-outlined text-xs text-on-secondary-container shrink-0">
                  location_on
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-secondary-container truncate">
                  {data.mostVisited?.name ?? "—"}
                </span>
              </div>
            </div>
            <p className="relative z-10 text-xs text-on-surface-variant leading-relaxed">
              {data.mostVisited
                ? `${data.mostVisited.visits} visits this month in ${data.mostVisited.neighborhood}`
                : "Start logging to see your favorite spot."}
            </p>
          </div>

          {/* Weekly Average */}
          <div className="bg-surface-container-low rounded-xl p-5 flex flex-col justify-between aspect-square">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                Weekly Average
              </h3>
              <div className="text-2xl font-extrabold tracking-tight text-primary">
                ₱{formatPrice(data.weeklyAverage, 2)}
              </div>
            </div>
            {/* trend: 5 weekly values normalized 0–1, oldest → newest */}
            <div className="flex items-end gap-1 h-8">
              {data.weeklyTrend.map((v, i) => (
                <div
                  key={i}
                  className={`w-full rounded-sm ${i === 4 ? "bg-primary" : "bg-primary/20"}`}
                  style={{ height: `${v * 100}%` }}
                />
              ))}
            </div>
          </div>

          {/* Sensory Palate Overview */}
          <div className="col-span-2 bg-surface-container-low p-5 rounded-xl space-y-4">
            <h3 className="font-bold text-sm tracking-tight text-on-surface">
              Sensory Palate Overview
            </h3>

            {data.categoryBreakdown.length === 0 ? (
              <p className="text-xs text-on-surface-variant italic">Log your first brew to see your breakdown.</p>
            ) : (
              <div className="space-y-3">
                {data.categoryBreakdown.map((item) => (
                  <div key={item.category}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-[0.625rem] font-bold uppercase tracking-widest text-on-surface-variant">
                        {item.category}
                      </span>
                      <span className="text-[0.625rem] text-on-surface-variant">
                        {item.percentage}%
                      </span>
                    </div>
                    <div className="h-1 bg-surface-container-high relative">
                      <div
                        className="absolute inset-y-0 left-0 bg-primary"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* This Month's Logs */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight">This Month</h3>
            <Link
              href="/profile/history"
              className="text-primary text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
            >
              View History
            </Link>
          </div>
          {data.recentEntries.length === 0 ? (
            <div className="bg-surface-container-low rounded-xl p-8 flex flex-col items-center gap-4 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">coffee</span>
              <div>
                <p className="text-sm font-bold text-on-surface">Nothing logged this month</p>
                <p className="text-xs text-on-surface-variant mt-1">Add your first brew of the month to get started.</p>
              </div>
              <Link
                href="/entry/new"
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-dim transition-colors"
              >
                Add First Log
              </Link>
            </div>
          ) : (
            <div className="bg-surface-container-low rounded-xl overflow-hidden">
              {data.recentEntries.map((entry, idx) => (
                <Link
                  key={entry._id}
                  href={`/entry/${entry._id}`}
                  className={`flex flex-col p-5 hover:bg-surface-container-high transition-colors group${idx < data.recentEntries.length - 1 ? " border-b border-surface-variant/50" : ""}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container-lowest text-primary group-hover:scale-95 transition-transform">
                        <span className="material-symbols-outlined text-xl">
                          {CATEGORY_ICON[entry.category]}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-bold text-sm text-on-surface">{entry.beverageName}</div>
                        <div className="text-xs text-on-surface-variant">
                          {entry.cafeName}{entry.cafeCity ? ` · ${entry.cafeCity}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-sm text-on-surface">
                      ₱{formatPrice(entry.totalPrice)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pl-14">
                    <Stars rating={entry.rating} />
                    <div className="text-[10px] font-medium uppercase tracking-widest text-on-surface-variant opacity-70">
                      {entry.displayDate}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
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
        <Link
          href="/"
          className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-lg px-3 py-1 transition-all"
        >
          <span className="material-symbols-outlined text-xl">menu_book</span>
          <span className="text-[9px] uppercase tracking-widest font-bold mt-0.5">Journal</span>
        </Link>
        <Link
          href="/cafes"
          className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary transition-all"
        >
          <span className="material-symbols-outlined text-xl">store</span>
          <span className="text-[9px] uppercase tracking-widest font-medium mt-0.5">Cafes</span>
        </Link>
        <Link
          href="/profile/history"
          className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary transition-all"
        >
          <span className="material-symbols-outlined text-xl">history</span>
          <span className="text-[9px] uppercase tracking-widest font-medium mt-0.5">History</span>
        </Link>
        <Link
          href="/profile"
          className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary transition-all"
        >
          <span className="material-symbols-outlined text-xl">person</span>
          <span className="text-[9px] uppercase tracking-widest font-medium mt-0.5">Profile</span>
        </Link>
      </nav>
    </>
  );
}
