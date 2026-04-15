"use client";

import Link from "next/link";
import { useState } from "react";
import type { BeverageCategory, IEntry } from "@/types";
import { BEVERAGE_CATEGORIES } from "@/types";

// ---------------------------------------------------------------------------
// Static data — replace with GET /api/entries (paginated, sorted by date desc)
// ---------------------------------------------------------------------------

const ALL_ENTRIES: (IEntry & { displayDate: string })[] = [
  {
    _id: "static-1",
    userId: "static",
    beverageName: "Matcha Latte",
    cafeName: "Starbucks",
    cafeCity: "BGC, Taguig",
    category: "Matcha",
    date: "2024-10-26T10:15:00.000Z",
    displayDate: "Oct 26",
    basePrice: 175,
    addOns: [],
    totalPrice: 315,
    rating: 5,
    tastingNotes: [],
    createdAt: "2024-10-26T10:15:00.000Z",
    updatedAt: "2024-10-26T10:15:00.000Z",
  },
  {
    _id: "static-2",
    userId: "static",
    beverageName: "Toasted Hojicha Flat White",
    cafeName: "Kurasu",
    cafeCity: "Poblacion, Makati",
    category: "Hojicha",
    date: "2024-10-24T14:00:00.000Z",
    displayDate: "Oct 24",
    basePrice: 96.5,
    addOns: [],
    totalPrice: 106.5,
    rating: 4,
    tastingNotes: [],
    createdAt: "2024-10-24T14:00:00.000Z",
    updatedAt: "2024-10-24T14:00:00.000Z",
  },
  {
    _id: "static-5",
    userId: "static",
    beverageName: "Hojicha Latte",
    cafeName: "Blue Bottle Coffee",
    cafeCity: "Rockwell, Makati",
    category: "Hojicha",
    date: "2024-10-20T09:30:00.000Z",
    displayDate: "Oct 20",
    basePrice: 195,
    addOns: [],
    totalPrice: 195,
    rating: 3,
    tastingNotes: [],
    createdAt: "2024-10-20T09:30:00.000Z",
    updatedAt: "2024-10-20T09:30:00.000Z",
  },
  {
    _id: "static-6",
    userId: "static",
    beverageName: "Cascara Tonic",
    cafeName: "The Curator",
    cafeCity: "Legazpi Village, Makati",
    category: "Specialty",
    date: "2024-09-30T16:00:00.000Z",
    displayDate: "Sept 30",
    basePrice: 220,
    addOns: [],
    totalPrice: 220,
    rating: 5,
    tastingNotes: [],
    createdAt: "2024-09-30T16:00:00.000Z",
    updatedAt: "2024-09-30T16:00:00.000Z",
  },
  {
    _id: "static-3",
    userId: "static",
    beverageName: "V60 Pour Over (Ethiopia)",
    cafeName: "Sightglass",
    cafeCity: "Salcedo Village, Makati",
    category: "Coffee",
    date: "2024-09-12T09:00:00.000Z",
    displayDate: "Sept 12",
    basePrice: 180,
    addOns: [],
    totalPrice: 210,
    rating: 4.5,
    tastingNotes: [],
    createdAt: "2024-09-12T09:00:00.000Z",
    updatedAt: "2024-09-12T09:00:00.000Z",
  },
  {
    _id: "static-7",
    userId: "static",
    beverageName: "Spanish Latte",
    cafeName: "Habitual Coffee",
    cafeCity: "Kapitolyo, Pasig",
    category: "Espresso & Milk",
    date: "2024-09-05T08:00:00.000Z",
    displayDate: "Sept 5",
    basePrice: 160,
    addOns: [],
    totalPrice: 160,
    rating: 4,
    tastingNotes: [],
    createdAt: "2024-09-05T08:00:00.000Z",
    updatedAt: "2024-09-05T08:00:00.000Z",
  },
  {
    _id: "static-4",
    userId: "static",
    beverageName: "White Peony Loose Leaf",
    cafeName: "Tea Atelier",
    cafeCity: "Quezon City",
    category: "Tea",
    date: "2024-08-11T14:30:00.000Z",
    displayDate: "Aug 11",
    basePrice: 105.5,
    addOns: [],
    totalPrice: 105.5,
    rating: 4,
    tastingNotes: [],
    createdAt: "2024-08-11T14:30:00.000Z",
    updatedAt: "2024-08-11T14:30:00.000Z",
  },
  {
    _id: "static-8",
    userId: "static",
    beverageName: "Iced Americano",
    cafeName: "Yardstick Coffee",
    cafeCity: "Salcedo Village, Makati",
    category: "Coffee",
    date: "2024-08-03T07:45:00.000Z",
    displayDate: "Aug 3",
    basePrice: 130,
    addOns: [],
    totalPrice: 130,
    rating: 5,
    tastingNotes: [],
    createdAt: "2024-08-03T07:45:00.000Z",
    updatedAt: "2024-08-03T07:45:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function formatPrice(amount: number): string {
  return amount.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function monthLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });
}

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
// Page
// ---------------------------------------------------------------------------

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<BeverageCategory | "All">("All");

  const filtered = ALL_ENTRIES.filter((e) => {
    const matchesCategory = activeCategory === "All" || e.category === activeCategory;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      e.beverageName.toLowerCase().includes(q) ||
      e.cafeName.toLowerCase().includes(q) ||
      (e.cafeCity ?? "").toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  // Group by month label, preserving order (entries are sorted newest first)
  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, entry) => {
    const label = monthLabel(entry.date);
    if (!acc[label]) acc[label] = [];
    acc[label].push(entry);
    return acc;
  }, {});

  return (
    <>
      {/* ── Top App Bar ── */}
      <header className="fixed top-0 left-0 w-full z-50 bg-surface flex justify-between items-center px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">local_cafe</span>
          <h1 className="text-base font-bold tracking-[-0.02em] text-primary">Brew Memoir</h1>
        </div>

        <nav className="hidden md:flex gap-6 items-center">
          <Link href="/" className="text-on-surface-variant text-[10px] uppercase tracking-widest hover:text-primary transition-colors">
            Journal
          </Link>
          <Link href="/cafes" className="text-on-surface-variant text-[10px] uppercase tracking-widest hover:text-primary transition-colors">
            Cafes
          </Link>
          <Link href="/profile/history" className="text-primary font-bold text-[10px] uppercase tracking-widest">
            History
          </Link>
        </nav>

        <Link
          href="/entry/new"
          className="hidden md:flex items-center gap-1.5 bg-primary text-on-primary px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-primary-dim active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Add Log
        </Link>
      </header>

      {/* ── Main ── */}
      <main className="pt-16 pb-32 px-4 max-w-2xl mx-auto space-y-6">

        {/* Search + Filters */}
        <section className="pt-4 space-y-4">
          <div>
            <label className="block text-[0.625rem] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
              Brew History Search
            </label>
            <div className="relative group">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cafes, beverages, or cities..."
                className="w-full bg-transparent border-0 border-b border-outline-variant/20 focus:border-primary focus:ring-0 focus:outline-none px-0 py-2 text-lg font-light placeholder:text-outline-variant/40 transition-all"
              />
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-linear-to-r from-primary to-primary-dim transition-all duration-300 group-focus-within:w-full" />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => setActiveCategory("All")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === "All"
                  ? "bg-secondary-container text-on-secondary-container"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              All
            </button>
            {BEVERAGE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? "bg-secondary-container text-on-secondary-container"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Grouped entries */}
        {Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant gap-2">
            <span className="material-symbols-outlined text-4xl opacity-30">search_off</span>
            <p className="text-sm font-medium">No entries found</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([month, entries]) => (
              <div key={month}>
                <h2 className="text-[0.75rem] font-bold uppercase tracking-[0.2em] text-outline mb-3 border-b border-outline-variant/10 pb-2">
                  {month}
                </h2>
                <div className="bg-surface-container-low rounded-xl overflow-hidden">
                  {entries.map((entry, idx) => (
                    <Link
                      key={entry._id}
                      href={`/entry/${entry._id}`}
                      className={`flex flex-col p-5 hover:bg-surface-container-high transition-colors group${
                        idx < entries.length - 1 ? " border-b border-surface-variant/30" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-lowest text-primary group-hover:scale-95 transition-transform">
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
                        <div className="font-bold text-sm text-primary">
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
            ))}
          </div>
        )}

      </main>

      {/* ── Bottom Nav (mobile) ── */}
      <nav
        aria-label="Main navigation"
        className="md:hidden fixed bottom-0 left-0 w-full bg-surface/90 backdrop-blur-xl flex justify-around items-center px-2 py-2 z-50 shadow-[0_-4px_16px_rgba(48,51,49,0.04)]"
      >
        <Link
          href="/"
          className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary transition-all"
        >
          <span className="material-symbols-outlined text-xl">menu_book</span>
          <span className="text-[9px] uppercase tracking-widest font-medium mt-0.5">Journal</span>
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
          className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-lg px-3 py-1 transition-all"
        >
          <span className="material-symbols-outlined text-xl">history</span>
          <span className="text-[9px] uppercase tracking-widest font-bold mt-0.5">History</span>
        </Link>
      </nav>
    </>
  );
}
