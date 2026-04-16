import Link from "next/link";
import { notFound } from "next/navigation";
import type { BeverageCategory, IEntry } from "@/types";

// ---------------------------------------------------------------------------
// Data layer — replace with: GET /api/cafes/:id
// ---------------------------------------------------------------------------

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

interface CafeDetail {
  _id: string;
  name: string;
  address: string;
  neighborhood: string;
  totalSpent: number;
  totalVisits: number;
  // visits per day of week, index 0 = Mon — replace with real aggregation
  visitsByDay: [number, number, number, number, number, number, number];
  weeklyAverage: number;
  entries: (IEntry & { displayDate: string })[];
}

const STATIC_CAFES: CafeDetail[] = [
  {
    _id: "cafe-1",
    name: "Yardstick Coffee",
    address: "Salcedo Village, Makati",
    neighborhood: "Salcedo Village, Makati",
    totalSpent: 5840,
    totalVisits: 12,
    visitsByDay: [3, 4, 7, 5, 4, 2, 2],
    weeklyAverage: 3.2,
    entries: [
      {
        _id: "static-5", userId: "static", cafeName: "Yardstick Coffee", cafeCity: "Salcedo Village, Makati",
        beverageName: "Single Origin Pourover", category: "Coffee",
        date: "2024-10-24T09:00:00.000Z", displayDate: "Oct 24, 2024",
        basePrice: 280, addOns: [], totalPrice: 280, rating: 5,
        tastingNotes: [], createdAt: "", updatedAt: "",
      },
      {
        _id: "static-6", userId: "static", cafeName: "Yardstick Coffee", cafeCity: "Salcedo Village, Makati",
        beverageName: "Iced Spanish Latte", category: "Espresso & Milk",
        date: "2024-10-21T10:30:00.000Z", displayDate: "Oct 21, 2024",
        basePrice: 240, addOns: [], totalPrice: 240, rating: 4,
        tastingNotes: [], createdAt: "", updatedAt: "",
      },
    ],
  },
  {
    _id: "cafe-2",
    name: "Kurasu",
    address: "Poblacion, Makati",
    neighborhood: "Poblacion, Makati",
    totalSpent: 4250,
    totalVisits: 6,
    visitsByDay: [1, 2, 3, 4, 5, 3, 1],
    weeklyAverage: 1.8,
    entries: [
      {
        _id: "static-2", userId: "static", cafeName: "Kurasu", cafeCity: "Poblacion, Makati",
        beverageName: "Toasted Hojicha Flat White", category: "Hojicha",
        date: "2024-10-15T14:00:00.000Z", displayDate: "Oct 15, 2024",
        basePrice: 320, addOns: [], totalPrice: 320, rating: 4,
        tastingNotes: [], createdAt: "", updatedAt: "",
      },
    ],
  },
  {
    _id: "cafe-3",
    name: "Sightglass",
    address: "Legazpi Village, Makati",
    neighborhood: "Legazpi Village, Makati",
    totalSpent: 3960,
    totalVisits: 8,
    visitsByDay: [2, 3, 5, 4, 3, 2, 1],
    weeklyAverage: 2.4,
    entries: [
      {
        _id: "static-3", userId: "static", cafeName: "Sightglass", cafeCity: "Legazpi Village, Makati",
        beverageName: "V60 Pour Over (Ethiopia)", category: "Coffee",
        date: "2024-10-08T09:00:00.000Z", displayDate: "Oct 08, 2024",
        basePrice: 210, addOns: [], totalPrice: 210, rating: 4.5,
        tastingNotes: [], createdAt: "", updatedAt: "",
      },
    ],
  },
  {
    _id: "cafe-4",
    name: "The Curator",
    address: "Legazpi Village, Makati",
    neighborhood: "Legazpi Village, Makati",
    totalSpent: 2450,
    totalVisits: 5,
    visitsByDay: [1, 1, 4, 2, 3, 2, 1],
    weeklyAverage: 1.5,
    entries: [
      {
        _id: "static-7", userId: "static", cafeName: "The Curator", cafeCity: "Legazpi Village, Makati",
        beverageName: "Peachy Flat White", category: "Espresso & Milk",
        date: "2024-09-30T09:45:00.000Z", displayDate: "Sept 30, 2024",
        basePrice: 290, addOns: [], totalPrice: 290, rating: 4.5,
        tastingNotes: [], createdAt: "", updatedAt: "",
      },
    ],
  },
  {
    _id: "cafe-5",
    name: "Commune",
    address: "Kapitolyo, Pasig",
    neighborhood: "Kapitolyo, Pasig",
    totalSpent: 1780,
    totalVisits: 4,
    visitsByDay: [1, 1, 2, 2, 3, 3, 2],
    weeklyAverage: 1.2,
    entries: [
      {
        _id: "static-8", userId: "static", cafeName: "Commune", cafeCity: "Kapitolyo, Pasig",
        beverageName: "Iced Matcha Latte", category: "Matcha",
        date: "2024-09-22T13:00:00.000Z", displayDate: "Sept 22, 2024",
        basePrice: 260, addOns: [], totalPrice: 260, rating: 4,
        tastingNotes: [], createdAt: "", updatedAt: "",
      },
    ],
  },
  {
    _id: "cafe-6",
    name: "Kalsada Coffee",
    address: "Katipunan, Quezon City",
    neighborhood: "Katipunan, Quezon City",
    totalSpent: 1260,
    totalVisits: 3,
    visitsByDay: [1, 0, 2, 1, 2, 1, 0],
    weeklyAverage: 0.9,
    entries: [
      {
        _id: "static-9", userId: "static", cafeName: "Kalsada Coffee", cafeCity: "Katipunan, Quezon City",
        beverageName: "Benguet Drip Coffee", category: "Coffee",
        date: "2024-09-10T09:00:00.000Z", displayDate: "Sept 10, 2024",
        basePrice: 180, addOns: [], totalPrice: 180, rating: 4.5,
        tastingNotes: [], createdAt: "", updatedAt: "",
      },
    ],
  },
];

function getCafe(id: string): CafeDetail | null {
  return STATIC_CAFES.find((c) => c._id === id) ?? null;
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
  Specialty: "auto_awesome",
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
  const cafe = getCafe(id);
  if (!cafe) notFound();

  const maxVisits = Math.max(...cafe.visitsByDay);

  return (
    <>
      {/* ── Top App Bar ── */}
      <header className="fixed top-0 left-0 w-full z-50 bg-surface flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-3">
          <Link
            href="/cafes"
            className="flex items-center justify-center p-2 rounded-full hover:bg-surface-container transition-colors"
            aria-label="Back"
          >
            <span className="material-symbols-outlined text-primary text-xl">arrow_back</span>
          </Link>
          <h1 className="text-base font-bold tracking-[-0.02em] text-primary">Brew Memoir</h1>
        </div>
        <button
          aria-label="More options"
          className="p-2 rounded-full hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-xl">more_vert</span>
        </button>
      </header>

      {/* ── Main ── */}
      <main className="pt-16 pb-32 px-6 max-w-2xl mx-auto">

        {/* Header */}
        <section className="pt-6 mb-8">
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
