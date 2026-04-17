"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { BeverageCategory, IEntry } from "@/types";
import { BEVERAGE_CATEGORIES } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeDisplayDate(dateStr: string): string {
  const d = new Date(dateStr);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

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

const PAGE_SIZE = 20;

type EntryWithDisplay = IEntry & { displayDate: string };

function toDisplay(e: IEntry): EntryWithDisplay {
  return { ...e, displayDate: computeDisplayDate(e.date) };
}

export default function HistoryPage() {
  const [allEntries, setAllEntries] = useState<EntryWithDisplay[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<BeverageCategory | "All">("All");

  async function fetchPage(pageNum: number, category: BeverageCategory | "All", append: boolean) {
    const catParam = category !== "All" ? `&category=${encodeURIComponent(category)}` : "";
    const data = await fetch(`/api/entries?page=${pageNum}&limit=${PAGE_SIZE}${catParam}`)
      .then((r) => r.json())
      .catch(() => ({ entries: [], total: 0 }));

    const entries = (data.entries ?? []).map(toDisplay);
    setAllEntries((prev) => append ? [...prev, ...entries] : entries);
    setTotal(data.total ?? 0);
    setPage(pageNum);
  }

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetchPage(1, activeCategory, false).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch from page 1 when category changes
  function handleCategoryChange(cat: BeverageCategory | "All") {
    setActiveCategory(cat);
    setSearch("");
    setLoading(true);
    fetchPage(1, cat, false).finally(() => setLoading(false));
  }

  async function handleLoadMore() {
    setLoadingMore(true);
    await fetchPage(page + 1, activeCategory, true);
    setLoadingMore(false);
  }

  const hasMore = allEntries.length < total;

  // Search is client-side on loaded entries only
  const filtered = allEntries.filter((e) => {
    const q = search.toLowerCase();
    return !q ||
      e.beverageName.toLowerCase().includes(q) ||
      e.cafeName.toLowerCase().includes(q) ||
      (e.cafeCity ?? "").toLowerCase().includes(q);
  });

  // Group by month label, preserving order (entries are sorted newest first)
  const grouped = filtered.reduce<Record<string, EntryWithDisplay[]>>((acc, entry) => {
    const label = monthLabel(entry.date);
    if (!acc[label]) acc[label] = [];
    acc[label].push(entry);
    return acc;
  }, {});

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
          <Link href="/cafes" className="text-on-surface-variant text-[10px] uppercase tracking-widest hover:text-primary transition-colors">
            Cafes
          </Link>
          <Link href="/profile/history" className="text-primary text-[10px] uppercase tracking-widest">
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
      <main className="pt-16 pb-32 px-6 max-w-2xl mx-auto space-y-6">

        {/* Search + Filters */}
        <section className="pt-6 space-y-4">
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
              onClick={() => handleCategoryChange("All")}
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
                onClick={() => handleCategoryChange(cat)}
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

          {/* Search scope note — shown when there are unloaded pages */}
          {hasMore && search && (
            <p className="text-[10px] text-on-surface-variant/60 font-medium">
              Searching {allEntries.length} of {total} entries —{" "}
              <button
                type="button"
                onClick={handleLoadMore}
                className="text-primary underline underline-offset-2"
              >
                load more
              </button>{" "}
              to search all
            </p>
          )}
        </section>

        {/* Grouped entries */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant/40 animate-spin">progress_activity</span>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-surface-container-low flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">coffee</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-on-surface">No rituals found</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed max-w-55 mx-auto">
                Try adjusting your filters or search term to discover your previous brews.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setSearch(""); setActiveCategory("All"); }}
                className="px-5 py-3 rounded-xl bg-surface-container text-on-surface text-sm font-bold hover:bg-surface-container-high transition-colors"
              >
                Clear Search
              </button>
              <Link
                href="/entry/new"
                className="px-5 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-primary-dim transition-colors"
              >
                Add New Ritual
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([month, entries]) => (
              <div key={month}>
                <div className="flex items-center justify-between mb-3 border-b border-outline-variant/10 pb-2">
                  <h2 className="text-[0.75rem] font-bold uppercase tracking-[0.2em] text-outline">
                    {month}
                  </h2>
                  <span className="text-[0.75rem] font-bold text-on-surface-variant">
                    ₱{entries.reduce((sum, e) => sum + e.totalPrice, 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
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
                              {entry.cafeName}
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
          {/* Load More */}
          {hasMore && (
            <div className="flex flex-col items-center gap-2 pt-2">
              <p className="text-[10px] font-medium text-on-surface-variant/50 uppercase tracking-widest">
                Showing {allEntries.length} of {total} entries
              </p>
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-3 rounded-xl bg-surface-container text-on-surface text-sm font-bold hover:bg-surface-container-high transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                    Loading…
                  </>
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          )}
          </div>
        )}

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
