import Link from "next/link";
import type { BeverageCategory, IEntry, OverviewStats } from "@/types";

// ---------------------------------------------------------------------------
// Data layer — replace these with async DB / API calls when backend is ready.
// The return types intentionally match the shared types in src/types/index.ts
// so swapping in real data requires only changing the function bodies.
// ---------------------------------------------------------------------------

function getMonthLabel(): string {
  return "September";
}

function getOverviewStats(): OverviewStats["currentMonth"] {
  return {
    totalSpent: 212.8,
    totalDrinks: 42,
    averagePerDrink: 1300.5,
    topChoices: ["Ceremonial Matcha", "Hojicha Latte", "Ethiopian Pour Over"],
    categoryBreakdown: [
      { category: "Coffee", count: 27, total: 138.32, percentage: 65 },
      { category: "Matcha", count: 9, total: 48.6, percentage: 21 },
      { category: "Tea", count: 6, total: 25.88, percentage: 14 },
    ],
  };
}

// Swap for a real aggregation query (e.g. top cafe by visit count this month)
function getTopCafe(): { name: string; visits: number; photoUrl: string | null } {
  return { name: "Onyx Coffee Lab", visits: 8, photoUrl: null };
}

function getRecentEntries(): (IEntry & { displayDate: string })[] {
  return [
    {
      _id: "static-1",
      userId: "static",
      cafeName: "Matcha Latte",
      beverageName: "Starbucks",
      category: "Matcha",
      date: new Date().toISOString(),
      displayDate: "Today, 10:15 AM",
      basePrice: 107.25,
      addOns: [],
      totalPrice: 107.25,
      rating: 5,
      tastingNotes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: "static-2",
      userId: "static",
      cafeName: "Kurasu",
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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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
  const month = getMonthLabel();
  const stats = getOverviewStats();
  const topCafe = getTopCafe();
  const entries = getRecentEntries();

  const categoryText = stats.categoryBreakdown
    .map((c) => `${c.percentage}% ${c.category}`)
    .join(", ");

  return (
    <>
      {/* ── Top App Bar ── */}
      <header className="fixed top-0 left-0 w-full z-50 bg-surface flex justify-between items-center px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">
            local_cafe
          </span>
          <h1 className="text-base font-bold tracking-[-0.02em] text-primary">
            Brew Memoir
          </h1>
        </div>

        <nav className="hidden md:flex gap-6 items-center">
          <Link
            href="/"
            className="text-primary font-bold text-[10px] uppercase tracking-widest"
          >
            Journal
          </Link>
          <Link
            href="/brew-guides"
            className="text-on-surface-variant text-[10px] uppercase tracking-widest hover:text-primary transition-colors"
          >
            Brew Guides
          </Link>
          <Link
            href="/origins"
            className="text-on-surface-variant text-[10px] uppercase tracking-widest hover:text-primary transition-colors"
          >
            Origins
          </Link>
          <Link
            href="/profile"
            className="text-on-surface-variant text-[10px] uppercase tracking-widest hover:text-primary transition-colors"
          >
            Profile
          </Link>
        </nav>

        <button
          aria-label="Notifications"
          className="material-symbols-outlined text-on-surface-variant p-1.5 hover:bg-surface-container rounded-full transition-colors text-xl"
        >
          notifications
        </button>
      </header>

      {/* ── Main content ── */}
      <main className="pt-16 pb-24 px-4 max-w-5xl mx-auto">
        {/* Hero summary */}
        <section className="mb-8 pt-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[0.625rem] font-medium uppercase tracking-widest text-on-surface-variant">
                Monthly Overview
              </span>
              <h2 className="text-4xl font-extrabold tracking-[-0.02em] text-on-surface">
                {month}
              </h2>
            </div>

            <div className="flex gap-8 md:gap-12">
              <div className="space-y-0.5">
                <span className="text-[0.625rem] font-medium uppercase tracking-widest text-on-surface-variant">
                  Total Spend
                </span>
                <div className="text-2xl font-bold tracking-tight text-primary">
                  ₱{formatPrice(stats.totalSpent)}
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[0.625rem] font-medium uppercase tracking-widest text-on-surface-variant">
                  Avg / Drink
                </span>
                <div className="text-2xl font-bold tracking-tight text-on-surface">
                  ₱{formatPrice(stats.averagePerDrink)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bento grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: stats + top choices */}
          <div className="lg:col-span-4 space-y-6">
            {/* Consumption card */}
            <div className="bg-surface-container-low p-6 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="material-symbols-outlined text-primary text-xl">
                  bar_chart
                </span>
                <span className="text-[0.625rem] font-bold uppercase tracking-widest text-on-surface-variant">
                  Consumption
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold">{stats.totalDrinks}</div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Beverages logged this month. {categoryText}.
                </p>
              </div>
            </div>

            {/* Sensory Palate Overview card */}
            <div className="bg-surface-container-low p-6 rounded-xl space-y-4">
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
                    <div className="h-px bg-surface-container-high relative">
                      <div
                        className="absolute inset-y-0 left-0 bg-primary"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-1 flex items-center gap-3">
                {/* Cafe photo — swap src for topCafe.photoUrl when backend is ready */}
                <div className="w-12 h-12 rounded-lg bg-black shrink-0 overflow-hidden">
                  {topCafe.photoUrl && (
                    <img
                      src={topCafe.photoUrl}
                      alt={topCafe.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[0.625rem] font-bold uppercase tracking-widest text-primary block">
                    Top Roastery
                  </span>
                  <span className="font-bold text-sm text-on-surface truncate block">
                    {topCafe.name}
                  </span>
                </div>
                <span className="px-3 py-1 bg-primary-container text-on-primary-container text-[10px] font-bold rounded-full shrink-0">
                  {topCafe.visits} visits
                </span>
              </div>
            </div>
          </div>

          {/* Right: recent logs */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-4">
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
                        <div className="font-bold text-sm text-on-surface">
                          {entry.cafeName}
                        </div>
                        <div className="text-xs text-on-surface-variant">
                          {entry.beverageName}
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
          </div>
        </div>
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
          <span className="text-[9px] uppercase tracking-widest font-bold mt-0.5">
            Journal
          </span>
        </Link>
        <Link
          href="/brew-guides"
          className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary transition-all"
        >
          <span className="material-symbols-outlined text-xl">
            temp_preferences_custom
          </span>
          <span className="text-[9px] uppercase tracking-widest font-medium mt-0.5">
            Guides
          </span>
        </Link>
        <Link
          href="/origins"
          className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary transition-all"
        >
          <span className="material-symbols-outlined text-xl">public</span>
          <span className="text-[9px] uppercase tracking-widest font-medium mt-0.5">
            Origins
          </span>
        </Link>
        <Link
          href="/profile"
          className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary transition-all"
        >
          <span className="material-symbols-outlined text-xl">person</span>
          <span className="text-[9px] uppercase tracking-widest font-medium mt-0.5">
            Profile
          </span>
        </Link>
      </nav>
    </>
  );
}
