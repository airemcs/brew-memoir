import Link from "next/link";
import type { ICafeWithStats } from "@/types";

// ---------------------------------------------------------------------------
// Data layer — replace with: GET /api/cafes
// ---------------------------------------------------------------------------

function getCafes(): (ICafeWithStats & {
  lastDrink: string;
  lastDate: string;
  tags: string[];
})[] {
  return [
    {
      _id: "cafe-1",
      userId: "static",
      name: "Calyx & Crema",
      address: "24th Street, Design District",
      neighborhood: "BGC, Taguig",
      tags: ["Botanical", "Quiet"],
      isFavorite: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastDrink: "London Matcha",
      lastDate: "Oct 26",
      stats: {
        totalVisits: 12,
        totalSpent: 5840,
        averageRating: 4.6,
        lastVisited: "2024-10-26T10:00:00.000Z",
      },
    },
    {
      _id: "cafe-2",
      userId: "static",
      name: "L'Artisan Roastery",
      address: "Old Town Heritage Loop",
      neighborhood: "Intramuros, Manila",
      tags: ["Heritage", "Pour Over"],
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastDrink: "Ethiopian Yirgacheffe",
      lastDate: "Oct 15",
      stats: {
        totalVisits: 6,
        totalSpent: 4250,
        averageRating: 4.3,
        lastVisited: "2024-10-15T14:00:00.000Z",
      },
    },
    {
      _id: "cafe-3",
      userId: "static",
      name: "The Brew Lab",
      address: "Tech Quarter, Level 4",
      neighborhood: "Eastwood, Quezon City",
      tags: ["Specialty", "Cold Brew"],
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastDrink: "Nitro Cold Brew",
      lastDate: "Oct 08",
      stats: {
        totalVisits: 8,
        totalSpent: 3960,
        averageRating: 4.1,
        lastVisited: "2024-10-08T11:30:00.000Z",
      },
    },
    {
      _id: "cafe-4",
      userId: "static",
      name: "Stonefruit Espresso",
      address: "Harbor Front Promenade",
      neighborhood: "Pasay City",
      tags: ["Espresso", "Seasonal"],
      isFavorite: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastDrink: "Peachy Flat White",
      lastDate: "Sept 30",
      stats: {
        totalVisits: 5,
        totalSpent: 2450,
        averageRating: 4.8,
        lastVisited: "2024-09-30T09:45:00.000Z",
      },
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

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

export default function CafesPage() {
  const cafes = getCafes();

  const [featured, ...rest] = cafes;
  const [second, third] = rest;
  const spotlight = cafes[3];

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
        <section className="pt-8 mb-10">
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
            {["All Visited", "Favorites", "Nearby"].map((tab, i) => (
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

        {/* Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-y-8 md:gap-x-10">

          {/* Feature Card */}
          <Link href={`/cafes/${featured._id}`} className="md:col-span-8 group">
            <div className="bg-surface-container-low p-7 rounded-2xl hover:bg-surface-container transition-colors duration-300 h-full flex flex-col justify-between">
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
              <div className="flex justify-between items-end border-t border-outline-variant/10 pt-5">
                <div>
                  <p className="text-[0.625rem] uppercase tracking-widest text-on-surface-variant mb-1">Last Ritual</p>
                  <p className="text-sm font-medium text-on-surface">
                    {featured.lastDrink}
                    <span className="text-on-surface-variant mx-2">·</span>
                    {featured.lastDate}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  {featured.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-[0.625rem] font-bold uppercase tracking-wider"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Link>

          {/* Portfolio Metric Panel — visible on all screen sizes */}
          <div className="md:col-span-4 bg-surface-container-low rounded-2xl p-7 flex flex-col justify-center gap-6 md:bg-transparent md:rounded-none md:p-0 md:border-l md:border-outline-variant/10 md:pl-8">
            <div>
              <h4 className="text-[0.625rem] uppercase tracking-[0.2em] text-on-surface-variant mb-2">
                Portfolio Value
              </h4>
              <p className="text-2xl font-semibold text-on-surface">₱{formatPrice(portfolioTotal)}</p>
              <p className="text-xs text-on-surface-variant mt-1">
                Total spend across {cafes.length} locations
              </p>
            </div>
            <div className="w-full h-px bg-outline-variant/15" />
            <div>
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

          {/* Minimal List Cards */}
          <Link href={`/cafes/${second._id}`} className="md:col-span-6 group block">
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 hover:bg-surface-container-low transition-all duration-300 h-full">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h3 className="text-xl font-bold text-on-surface">{second.name}</h3>
                  <p className="text-xs text-on-surface-variant mt-1">{second.address}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-on-surface">₱{formatPrice(second.stats.totalSpent)}</p>
                  <p className="text-[0.5625rem] uppercase tracking-widest text-on-surface-variant">Spent</p>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant italic">
                Last: {second.lastDrink} · {second.lastDate}
              </p>
            </div>
          </Link>

          <Link href={`/cafes/${third._id}`} className="md:col-span-6 group block">
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 hover:bg-surface-container-low transition-all duration-300 h-full">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h3 className="text-xl font-bold text-on-surface">{third.name}</h3>
                  <p className="text-xs text-on-surface-variant mt-1">{third.address}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-light text-primary">{third.stats.totalVisits}</span>
                  <p className="text-[0.5625rem] uppercase tracking-widest text-on-surface-variant">Visits</p>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant italic">
                Last: {third.lastDrink} · {third.lastDate}
              </p>
            </div>
          </Link>

          {/* Spotlight Full-Width Dark Card */}
          <Link href={`/cafes/${spotlight._id}`} className="md:col-span-12 group block mt-2">
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
