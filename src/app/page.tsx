import Link from "next/link";
import type { BeverageCategory, IEntry, OverviewStats } from "@/types";

// ---------------------------------------------------------------------------
// Data layer — replace these with async DB / API calls when backend is ready.
// The return types intentionally match the shared types in src/types/index.ts
// so swapping in real data requires only changing the function bodies.
// ---------------------------------------------------------------------------

// Replace with: GET /api/analytics/budget — user's monthly budget + current spend
function getBudgetStats(): { totalSpent: number; budgetAmount: number } {
  return { totalSpent: 12450, budgetAmount: 10000 };
}

// Replace with: currentMonth from GET /api/analytics/overview
function getOverviewStats(): OverviewStats["currentMonth"] {
  return {
    totalSpent: 12450,
    totalDrinks: 37,
    averagePerDrink: 336,
    topChoices: ["Spanish Latte", "Iced Matcha Latte", "Pour Over"],
    categoryBreakdown: [
      { category: "Coffee", count: 20, total: 7200, percentage: 65 },
      { category: "Matcha", count: 5, total: 2100, percentage: 21 },
      { category: "Espresso & Milk", count: 12, total: 3150, percentage: 14 },
    ],
  };
}

// Swap for a real aggregation query (e.g. top cafe by visit count this month)
function getTopCafe(): { name: string; visits: number; photoUrl: string | null } {
  return { name: "Yardstick", visits: 8, photoUrl: null };
}

// Replace with: top cafe by visit count from GET /api/analytics/overview
function getMostVisited(): {
  name: string;
  neighborhood: string;
  visits: number;
  mapPhotoUrl: string | null;
} {
  return {
    name: "Yardstick",
    neighborhood: "Makati City",
    visits: 8,
    mapPhotoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCDaO9DEjvQ9XZvAsT42ZUKuZ8cqyFBoOblLVt2lsVCvw5b-1T0IJKePJkD0Il9zITvC24Mu6rkg4kixItqEH5CXK5KGGxA5zNfup_Unqz0bY5owjIWEcEVMq5M5IyC29435rQp1xEzhh-8z5tZtWcnTE4_iveQkp2ZsFGv96pPblYW3_eWdPrbYuWIkGtaqoVZ_HXdsGOJHTdoZ6W4EwLSHXiafwydwehEvO_eliBPoCiY1lFA8D7uCsnejJUoAKAevmZtft6vwik",
  };
}

// Replace with: totalSpent / weeks_elapsed from GET /api/analytics/overview
// trend: 5 weekly values normalized 0–1, oldest → newest
function getWeeklyAverageStats(): {
  average: number;
  trend: [number, number, number, number, number];
} {
  return { average: 3115, trend: [0.5, 0.75, 1.0, 0.67, 0.5] };
}

function getRecentEntries(): (IEntry & { displayDate: string })[] {
  return [
    {
      _id: "static-1",
      userId: "static",
      cafeName: "Starbucks",
      cafeCity: "BGC, Taguig",
      beverageName: "Matcha Latte",
      category: "Matcha",
      date: new Date().toISOString(),
      displayDate: "Today",
      basePrice: 175,
      addOns: [],
      totalPrice: 175,
      rating: 5,
      tastingNotes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: "static-2",
      userId: "static",
      cafeName: "Kurasu",
      cafeCity: "Poblacion, Makati",
      beverageName: "Toasted Hojicha Flat White",
      category: "Hojicha",
      date: new Date(Date.now() - 86400000).toISOString(),
      displayDate: "Yesterday",
      basePrice: 106.5,
      addOns: [],
      totalPrice: 106.5,
      rating: 4,
      tastingNotes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: "static-3",
      userId: "static",
      cafeName: "Sightglass",
      cafeCity: "Salcedo Village, Makati",
      beverageName: "V60 Pour Over (Ethiopia)",
      category: "Coffee",
      date: "2024-09-12T09:00:00.000Z",
      displayDate: "Sep 12",
      basePrice: 107.0,
      addOns: [],
      totalPrice: 107.0,
      rating: 4.5,
      tastingNotes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: "static-4",
      userId: "static",
      cafeName: "Tea Atelier",
      cafeCity: "Quezon City",
      beverageName: "White Peony Loose Leaf",
      category: "Fruit & Refresher",
      date: "2024-09-11T14:30:00.000Z",
      displayDate: "Sep 11",
      basePrice: 105.5,
      addOns: [],
      totalPrice: 105.5,
      rating: 4,
      tastingNotes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(amount: number): string {
  return amount.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

export default function HomePage() {
  const budget = getBudgetStats();
  const stats = getOverviewStats();
  const topCafe = getTopCafe();
  const mostVisited = getMostVisited();
  const weeklyAvg = getWeeklyAverageStats();
  const entries = getRecentEntries().slice(0, 3);

  const budgetExceeded = budget.totalSpent > budget.budgetAmount;
  const budgetPercentRaw = Math.round((budget.totalSpent / budget.budgetAmount) * 100);
  const budgetPercent = Math.min(100, budgetPercentRaw);

  return (
    <>
      {/* ── Top App Bar ── */}
      <header className="fixed top-0 left-0 w-full z-50 bg-surface flex justify-between items-center px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">local_cafe</span>
          <h1 className="text-base font-bold tracking-[-0.02em] text-primary">Brew Memoir</h1>
        </div>

        <nav className="hidden md:flex gap-6 items-center">
          <Link href="/" className="text-primary font-bold text-[10px] uppercase tracking-widest">
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
      <main className="pt-16 pb-24 px-4 max-w-5xl mx-auto space-y-8">

        {/* Monthly Spend Budget */}
        <section className="space-y-4 pt-4">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-[10px] font-medium uppercase tracking-widest text-on-surface-variant">
                Monthly Spend
              </span>
              <h2 className="text-4xl font-extrabold tracking-tight text-on-background">
                ₱{formatPrice(budget.totalSpent)}
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
            <div className="relative z-10">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                Most Visited
              </h3>
              <div className="inline-flex items-center gap-1.5 bg-secondary-container px-3 py-1 rounded-full">
                <span className="material-symbols-outlined text-xs text-on-secondary-container">
                  location_on
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-secondary-container">
                  {mostVisited.name}
                </span>
              </div>
            </div>
            {/* Swap src for mostVisited.mapPhotoUrl when backend provides it */}
            {mostVisited.mapPhotoUrl && (
              <div className="absolute inset-0 opacity-10">
                <img
                  src={mostVisited.mapPhotoUrl}
                  alt="Location map"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <p className="relative z-10 text-xs text-on-surface-variant leading-relaxed">
              {mostVisited.visits} visits this month in {mostVisited.neighborhood}.
            </p>
          </div>

          {/* Weekly Average */}
          <div className="bg-surface-container-low rounded-xl p-5 flex flex-col justify-between aspect-square">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                Weekly Average
              </h3>
              <div className="text-2xl font-extrabold tracking-tight text-primary">
                ₱{formatPrice(weeklyAvg.average)}
              </div>
            </div>
            {/* trend: 5 weekly values normalized 0–1, oldest → newest */}
            <div className="flex items-end gap-1 h-8">
              {weeklyAvg.trend.map((v, i) => (
                <div
                  key={i}
                  className={`w-full rounded-sm ${i === 2 ? "bg-primary" : "bg-primary/20"}`}
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

            {/* Category bars */}
            <div className="space-y-3">
              {stats.categoryBreakdown.map((item) => (
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
          </div>
        </div>

        {/* Recent Logs */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight">Recent Logs</h3>
            <Link
              href="/profile/history"
              className="text-primary text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
            >
              View History
            </Link>
          </div>
          <div className="bg-surface-container-low rounded-xl overflow-hidden">
            {entries.map((entry, idx) => (
              <Link
                key={entry._id}
                href={`/entry/${entry._id}`}
                className={`flex flex-col p-5 hover:bg-surface-container-high transition-colors group${idx < entries.length - 1 ? " border-b border-surface-variant/50" : ""}`}
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
      </nav>
    </>
  );
}
