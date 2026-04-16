import Link from "next/link";
import { Types } from "mongoose";
import type { BeverageCategory, ICafeWithStats } from "@/types";
import { connectDB } from "@/lib/db";
import { Cafe, Entry } from "@/lib/models";
import { getServerUserId } from "@/lib/serverAuth";

// ---------------------------------------------------------------------------
// Data layer
// ---------------------------------------------------------------------------

type CafeEntry = ICafeWithStats & {
  lastDrink: string;
  lastDate: string;
  lastCategory: BeverageCategory;
};

async function getCafes(): Promise<CafeEntry[]> {
  const userId = await getServerUserId();
  if (!userId) return [];

  await connectDB();
  const userObjectId = new Types.ObjectId(userId);

  // Sort entries by date desc first so $first gives the most recent value
  const statsAgg = await Entry.aggregate([
    { $match: { userId: userObjectId } },
    { $sort: { date: -1 } },
    {
      $group: {
        _id: "$cafeId",
        totalVisits: { $sum: 1 },
        totalSpent: { $sum: "$totalPrice" },
        averageRating: { $avg: "$rating" },
        lastVisited: { $first: "$date" },
        lastDrink: { $first: "$beverageName" },
        lastCategory: { $first: "$category" },
      },
    },
  ]);

  const statsMap = new Map(statsAgg.map((s) => [s._id?.toString(), s]));
  const cafes = await Cafe.find({ userId: userObjectId }).lean();

  return cafes
    .map((cafe) => {
      const s = statsMap.get(cafe._id.toString());
      return {
        _id: cafe._id.toString(),
        userId: cafe.userId.toString(),
        name: cafe.name,
        address: cafe.address ?? "",
        neighborhood: cafe.neighborhood ?? "",
        tags: cafe.tags,
        isFavorite: cafe.isFavorite,
        createdAt: cafe.createdAt.toISOString(),
        updatedAt: cafe.updatedAt.toISOString(),
        lastDrink: s?.lastDrink ?? "—",
        lastDate: s?.lastVisited
          ? new Date(s.lastVisited).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "—",
        lastCategory: (s?.lastCategory ?? "Coffee") as BeverageCategory,
        stats: {
          totalVisits: s?.totalVisits ?? 0,
          totalSpent: s?.totalSpent ?? 0,
          averageRating: s?.averageRating ? Math.round(s.averageRating * 10) / 10 : undefined,
          lastVisited: s?.lastVisited ? new Date(s.lastVisited).toISOString() : undefined,
        },
      } satisfies CafeEntry;
    })
    .sort((a, b) => (b.stats.averageRating ?? -1) - (a.stats.averageRating ?? -1));
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


// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

export default async function CafesPage() {
  const cafes = await getCafes();

  // Most visited — highest totalVisits
  const featured = cafes.length > 0
    ? [...cafes].sort((a, b) => b.stats.totalVisits - a.stats.totalVisits)[0]
    : null;

  // Best rated — highest averageRating among cafes that have ratings
  const rated = cafes.filter((c) => c.stats.averageRating !== undefined);
  const spotlight = rated.length > 0
    ? [...rated].sort((a, b) => (b.stats.averageRating ?? 0) - (a.stats.averageRating ?? 0))[0]
    : null;

  // Replace with: GET /api/analytics/cafes — portfolio total
  const portfolioTotal = cafes.reduce((sum, c) => sum + c.stats.totalSpent, 0);

  return (
    <>
      {/* ── Top App Bar ── */}
      <header className="fixed top-0 left-0 w-full z-50 bg-surface flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">local_cafe</span>
          <h1 className="text-base font-bold tracking-[-0.02em] text-primary">Brew Memoir</h1>
        </div>

        <nav className="hidden md:flex gap-6 items-center">
          <Link href="/" className="text-on-surface-variant text-[10px] uppercase tracking-widest hover:text-primary transition-colors">
            Journal
          </Link>
          <Link href="/cafes" className="text-primary text-[10px] uppercase tracking-widest">
            Cafes
          </Link>
          <Link href="/profile/history" className="text-on-surface-variant text-[10px] uppercase tracking-widest hover:text-primary transition-colors">
            History
          </Link>
          <Link href="/profile" className="text-on-surface-variant text-[10px] uppercase tracking-widest hover:text-primary transition-colors">
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

      {/* ── Main ── */}
      <main className="pt-16 pb-32 px-6 max-w-5xl mx-auto">

        {/* Editorial Header */}
        <section className="pt-6 mb-10">
          <span className="text-[0.625rem] uppercase tracking-[0.2em] font-medium text-on-surface-variant block mb-2">
            Curated Collection
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight text-on-surface mb-3">
            The Directory
          </h2>
          <p className="text-sm text-on-surface-variant max-w-md leading-relaxed">
            A chronological archive of the spaces where every extraction tells a unique story.
          </p>
        </section>

        {/* Tab filter */}
        <div className="mb-10 flex items-center justify-between border-b border-outline-variant/20 pb-0">
          <div className="flex gap-6 items-center">
            {["All Visited"].map((tab, i) => (
              <button
                key={tab}
                className={`text-[0.6875rem] uppercase tracking-[0.15em] font-bold pb-3 border-b-2 transition-colors ${
                  i === 0
                    ? "text-primary border-primary"
                    : "text-on-surface-variant border-transparent hover:text-on-surface"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button aria-label="Filter" className="p-1.5 hover:bg-surface-container rounded-full transition-colors mb-1">
            <span className="material-symbols-outlined text-on-surface-variant text-lg">tune</span>
          </button>
        </div>

        <div className="flex flex-col gap-8">

          {/* ── Row 1: Feature Card (full width) ── */}
          {featured && (
            <Link href={`/cafes/${featured._id}`} className="group block">
              <div className="bg-surface-container-low p-7 rounded-2xl hover:bg-surface-container transition-colors duration-300">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h3 className="text-2xl font-bold text-on-surface mb-1">{featured.name}</h3>
                    <p className="text-sm text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {featured.address}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-light text-primary">{featured.stats.totalVisits}</span>
                    <p className="text-[0.625rem] uppercase tracking-widest text-on-surface-variant">Visits</p>
                  </div>
                </div>
                <div className="border-t border-outline-variant/10 pt-5 flex flex-col gap-1">
                  <p className="text-[0.625rem] uppercase tracking-widest text-on-surface-variant">Last Ritual</p>
                  <p className="text-base font-semibold text-on-surface">
                    {featured.lastDrink}
                  </p>
                  <p className="text-sm text-on-surface-variant">
                    {featured.lastCategory}
                    <span className="mx-2">·</span>
                    {featured.lastDate}
                  </p>
                </div>
              </div>
            </Link>
          )}

          {/* ── Row 2: Spotlight (Highlight) ── */}
          {spotlight && (
            <Link href={`/cafes/${spotlight._id}`} className="group block">
              <div className="relative overflow-hidden bg-on-background p-10 rounded-2xl">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="text-center md:text-left">
                    <span className="text-[0.625rem] uppercase tracking-[0.2em] text-outline-variant mb-2 block">
                      Highlight
                    </span>
                    <h3 className="text-3xl font-bold text-background mb-1">{spotlight.name}</h3>
                    <p className="text-sm text-outline-variant">{spotlight.address}</p>
                  </div>
                  <div className="flex gap-10 text-center">
                    <div>
                      <p className="text-3xl font-light text-primary-fixed">{spotlight.stats.totalVisits}</p>
                      <p className="text-[0.625rem] uppercase tracking-widest text-outline-variant">Visits</p>
                    </div>
                    <div>
                      <p className="text-3xl font-light text-primary-fixed">₱{formatPrice(spotlight.stats.totalSpent)}</p>
                      <p className="text-[0.625rem] uppercase tracking-widest text-outline-variant">Total Spent</p>
                    </div>
                  </div>
                  <div className="border-t md:border-t-0 md:border-l border-outline-variant/20 pt-6 md:pt-0 md:pl-8 text-center md:text-left">
                    <p className="text-[0.625rem] uppercase tracking-widest text-outline-variant mb-2">Most Recent</p>
                    <p className="text-sm text-background">
                      {spotlight.lastDrink}
                      <br />
                      <span className="text-outline-variant text-xs">{spotlight.lastDate}</span>
                    </p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-linear-to-br from-on-background via-[#252826] to-on-background opacity-90" />
              </div>
            </Link>
          )}

          {/* ── Row 3: Portfolio Value + Category Breakdown ── */}
          <div className="bg-surface-container-low rounded-2xl p-7 flex flex-col md:flex-row gap-8 md:gap-16">
            <div className="flex flex-col gap-1">
              <h4 className="text-[0.625rem] uppercase tracking-[0.2em] text-on-surface-variant mb-1">
                Portfolio Value
              </h4>
              <p className="text-2xl font-semibold text-on-surface">₱{formatPrice(portfolioTotal)}</p>
              <p className="text-xs text-on-surface-variant">
                Total spend across {cafes.length} locations
              </p>
            </div>
            <div className="w-px bg-outline-variant/15 hidden md:block self-stretch" />
            <div className="flex-1">
              <h4 className="text-[0.625rem] uppercase tracking-[0.2em] text-on-surface-variant mb-3">
                Roaster Diversity
              </h4>
              <div className="flex gap-2 mb-2">
                <div className="h-1 flex-1 bg-primary rounded-full" />
                <div className="h-1 flex-1 bg-secondary rounded-full" />
                <div className="h-1 w-8 bg-tertiary rounded-full" />
              </div>
              <p className="text-xs text-on-surface-variant">72% Dark Roast profile preference</p>
            </div>
          </div>

          {/* ── Row 4: Per-Cafe List ── */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">
                All Locations
              </h3>
              <span className="text-xs text-on-surface-variant">{cafes.length} cafes</span>
            </div>
            <div className="bg-surface-container-low rounded-2xl overflow-hidden">
              {cafes.map((cafe, idx) => (
                <Link
                  key={cafe._id}
                  href={`/cafes/${cafe._id}`}
                  className={`flex items-center justify-between px-6 py-4 hover:bg-surface-container transition-colors group${
                    idx < cafes.length - 1 ? " border-b border-outline-variant/10" : ""
                  }`}
                >
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                      {cafe.name}
                    </span>
                    <span className="text-xs text-on-surface-variant">{cafe.address}</span>
                    <span className="text-xs text-on-surface-variant italic mt-0.5 truncate">
                      Last: {cafe.lastDrink}
                    </span>
                  </div>
                  <div className="text-right flex flex-col items-end gap-0.5 ml-6 shrink-0">
                    <span className="text-sm font-semibold text-on-surface">
                      ₱{formatPrice(cafe.stats.totalSpent)}
                    </span>
                    <span className="text-[0.5625rem] uppercase tracking-widest text-on-surface-variant">Spent</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

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
