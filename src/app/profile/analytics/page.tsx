"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { IEntry } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHART_COLORS = [
  "#79573f",
  "#9e6d52",
  "#6e5b4d",
  "#6a5f38",
  "#a68b5b",
  "#c4956a",
  "#9e422c",
  "#b08870",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(amount: number): string {
  return amount.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function getMonthlyTrend(entries: IEntry[]): { month: string; total: number }[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const label = d.toLocaleDateString("en-US", { month: "short" });
    const total = entries
      .filter((e) => {
        const ed = new Date(e.date);
        return ed.getFullYear() === year && ed.getMonth() === month;
      })
      .reduce((sum, e) => sum + e.totalPrice, 0);
    return { month: label, total };
  });
}

function getTopCafes(entries: IEntry[]): { name: string; total: number; visits: number }[] {
  const map = new Map<string, { total: number; visits: number }>();
  for (const e of entries) {
    const prev = map.get(e.cafeName) ?? { total: 0, visits: 0 };
    map.set(e.cafeName, { total: prev.total + e.totalPrice, visits: prev.visits + 1 });
  }
  return [...map.entries()]
    .map(([name, s]) => ({ name, ...s }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CategoryRow {
  category: string;
  count: number;
  total: number;
  percentage: number;
}

interface OverviewData {
  currentMonth: {
    totalSpent: number;
    totalDrinks: number;
    averagePerDrink: number;
    topChoices: string[];
    categoryBreakdown: CategoryRow[];
  };
}

// ---------------------------------------------------------------------------
// Custom Recharts tooltip — defined outside the page to avoid re-mounts
// ---------------------------------------------------------------------------

function SpendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid rgba(121,87,63,0.15)",
        borderRadius: 12,
        padding: "10px 14px",
        boxShadow: "0 4px 16px rgba(48,51,49,0.08)",
      }}
    >
      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#5d605d",
          marginBottom: 4,
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 14, fontWeight: 700, color: "#79573f" }}>
        ₱{formatPrice(payload[0].value)}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [budgetAmount, setBudgetAmount] = useState(2_000);
  const [portfolioTotal, setPortfolioTotal] = useState(0);
  const [entries, setEntries] = useState<IEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    Promise.all([
      fetch("/api/analytics/overview").then((r) => r.json()),
      fetch("/api/analytics/budget").then((r) => r.json()),
      fetch("/api/analytics/cafes").then((r) => r.json()),
      fetch("/api/entries?limit=200").then((r) => r.json()),
    ])
      .then(([ov, bud, cafes, ents]) => {
        setOverview(ov);
        setBudgetAmount(bud.budgetAmount ?? 2_000);
        setPortfolioTotal(cafes.portfolioTotal ?? 0);
        setEntries(ents.entries ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const monthlyTrend = getMonthlyTrend(entries);
  const topCafes = getTopCafes(entries);
  const cm = overview?.currentMonth;
  const budgetUsed = cm
    ? Math.min(100, Math.round((cm.totalSpent / budgetAmount) * 100))
    : 0;

  return (
    <>
      {/* ── Top App Bar ── */}
      <header className="fixed top-0 left-0 w-full z-50 bg-surface flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">local_cafe</span>
          <h1 className="text-base font-bold tracking-[-0.02em] text-primary">Brew Memoir</h1>
        </div>
        <nav className="hidden md:flex gap-6 items-center">
          <Link href="/" className="text-on-surface-variant text-[10px] uppercase tracking-widest hover:text-primary transition-colors">Journal</Link>
          <Link href="/cafes" className="text-on-surface-variant text-[10px] uppercase tracking-widest hover:text-primary transition-colors">Cafes</Link>
          <Link href="/profile/history" className="text-on-surface-variant text-[10px] uppercase tracking-widest hover:text-primary transition-colors">History</Link>
          <Link href="/profile" className="text-primary text-[10px] uppercase tracking-widest">Profile</Link>
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

        {/* Editorial header */}
        <section className="pt-8 space-y-2">
          <span className="text-[0.6875rem] uppercase tracking-[0.15em] font-bold text-primary">
            Insights
          </span>
          <h2 className="text-4xl font-extrabold tracking-[-0.02em] text-on-surface">
            Your Brew Report
          </h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            A portrait of your rituals — taste, habit, and spend.
          </p>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant/40 animate-spin">
              progress_activity
            </span>
          </div>
        ) : entries.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-surface-container-low flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">insights</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-on-surface">No data yet</h3>
              <p className="text-sm text-on-surface-variant max-w-56 mx-auto leading-relaxed">
                Start logging rituals to see your brew analytics take shape.
              </p>
            </div>
            <Link
              href="/entry/new"
              className="px-6 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-primary-dim transition-colors"
            >
              Log Your First Ritual
            </Link>
          </div>
        ) : (
          <>
            {/* ── Summary Stats ── */}
            <section className="grid grid-cols-2 gap-3">

              {/* Budget progress — full width */}
              <div className="col-span-2 p-6 bg-surface-container-low rounded-2xl flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[0.75rem] uppercase tracking-widest font-bold text-on-surface-variant block mb-1">
                      This Month
                    </span>
                    <span className="text-3xl font-extrabold text-on-surface tracking-tight">
                      ₱{formatPrice(cm?.totalSpent ?? 0)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[0.75rem] font-bold text-on-surface-variant">
                      of ₱{formatPrice(budgetAmount)}
                    </span>
                    <span
                      className={`block text-2xl font-extrabold ${
                        budgetUsed >= 90
                          ? "text-error"
                          : budgetUsed >= 70
                          ? "text-tertiary"
                          : "text-primary"
                      }`}
                    >
                      {budgetUsed}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      budgetUsed >= 90 ? "bg-error" : "bg-primary"
                    }`}
                    style={{ width: `${budgetUsed}%` }}
                  />
                </div>
              </div>

              {/* Drinks count */}
              <div className="p-5 bg-surface-container-low rounded-2xl flex flex-col gap-1">
                <span className="material-symbols-outlined text-primary text-xl">local_drink</span>
                <span className="text-2xl font-extrabold text-on-surface">{cm?.totalDrinks ?? 0}</span>
                <span className="text-[0.75rem] uppercase tracking-widest font-bold text-on-surface-variant">
                  Drinks
                </span>
              </div>

              {/* Avg per drink */}
              <div className="p-5 bg-surface-container-low rounded-2xl flex flex-col gap-1">
                <span className="material-symbols-outlined text-secondary text-xl">receipt</span>
                <span className="text-2xl font-extrabold text-on-surface">
                  ₱{formatPrice(cm?.averagePerDrink ?? 0)}
                </span>
                <span className="text-[0.75rem] uppercase tracking-widest font-bold text-on-surface-variant">
                  Avg / Drink
                </span>
              </div>

              {/* All-time total */}
              <div className="col-span-2 p-5 bg-surface-container-low rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[0.75rem] uppercase tracking-widest font-bold text-on-surface-variant block mb-1">
                    All-Time Spend
                  </span>
                  <span className="text-2xl font-extrabold text-on-surface">
                    ₱{formatPrice(portfolioTotal)}
                  </span>
                </div>
                <span
                  className="material-symbols-outlined text-5xl text-primary-fixed-dim"
                  style={{ fontVariationSettings: "'wght' 200" }}
                >
                  savings
                </span>
              </div>
            </section>

            {/* ── Monthly Spending Trend ── */}
            <section className="bg-surface-container-low rounded-2xl p-6">
              <h3 className="text-[0.75rem] uppercase tracking-widest font-bold text-on-surface-variant mb-6">
                Monthly Spend — Last 6 Months
              </h3>
              {mounted && (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={monthlyTrend} barSize={32} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "#5d605d", fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide domain={[0, Math.max(budgetAmount * 1.1, ...monthlyTrend.map(m => m.total) )]} />
                    <Tooltip content={<SpendTooltip />} cursor={{ fill: "rgba(121,87,63,0.05)" }} />
                    <ReferenceLine
                      y={budgetAmount}
                      stroke="#9e422c"
                      strokeDasharray="4 3"
                      strokeWidth={1.5}
                    />
                    <Bar dataKey="total" fill="#79573f" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              <div className="flex items-center gap-2 mt-3">
                <div className="w-6 border-t-2 border-dashed" style={{ borderColor: "#9e422c99" }} />
                <span className="text-[10px] font-medium text-on-surface-variant">Monthly budget</span>
              </div>
            </section>

            {/* ── Category Breakdown ── */}
            {cm && cm.categoryBreakdown.length > 0 && (
              <section className="bg-surface-container-low rounded-2xl p-6">
                <h3 className="text-[0.75rem] uppercase tracking-widest font-bold text-on-surface-variant mb-6">
                  Category Breakdown — This Month
                </h3>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {mounted && (
                    <div className="shrink-0">
                      <PieChart width={160} height={160}>
                        <Pie
                          data={cm.categoryBreakdown}
                          cx={75}
                          cy={75}
                          innerRadius={48}
                          outerRadius={72}
                          paddingAngle={2}
                          dataKey="count"
                          strokeWidth={0}
                        >
                          {cm.categoryBreakdown.map((_, i) => (
                            <Cell
                              key={i}
                              fill={CHART_COLORS[i % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </div>
                  )}
                  <div className="flex-1 w-full space-y-2.5">
                    {cm.categoryBreakdown.map((row, i) => (
                      <div key={row.category} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                          />
                          <span className="text-xs font-semibold text-on-surface truncate">
                            {row.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-on-surface-variant">{row.count}x</span>
                          <span className="text-xs font-bold text-on-surface w-8 text-right">
                            {row.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* ── Most Ordered This Month ── */}
            {cm && cm.topChoices.length > 0 && (
              <section className="bg-surface-container-low rounded-2xl p-6">
                <h3 className="text-[0.75rem] uppercase tracking-widest font-bold text-on-surface-variant mb-5">
                  Most Ordered — This Month
                </h3>
                <div className="space-y-4">
                  {cm.topChoices.map((name, i) => (
                    <div key={name} className="flex items-center gap-4">
                      <span className="text-2xl font-extrabold text-primary-fixed-dim w-7 text-center leading-none shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-on-surface">{name}</span>
                      </div>
                      {i === 0 && (
                        <span
                          className="material-symbols-outlined text-base text-tertiary"
                          style={{ fontVariationSettings: "'wght' 300" }}
                        >
                          workspace_premium
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Top Cafes by All-Time Spend ── */}
            {topCafes.length > 0 && (
              <section className="bg-surface-container-low rounded-2xl p-6">
                <h3 className="text-[0.75rem] uppercase tracking-widest font-bold text-on-surface-variant mb-6">
                  Top Cafes by Spend — All Time
                </h3>
                <div className="space-y-5">
                  {topCafes.map((cafe, i) => {
                    const pct = Math.round((cafe.total / topCafes[0].total) * 100);
                    return (
                      <div key={cafe.name} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xs font-extrabold text-on-surface-variant/40 w-4 shrink-0 text-right">
                              {i + 1}
                            </span>
                            <span className="text-sm font-semibold text-on-surface truncate">
                              {cafe.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[10px] font-medium text-on-surface-variant">
                              {cafe.visits} visit{cafe.visits !== 1 ? "s" : ""}
                            </span>
                            <span className="text-sm font-bold text-primary">
                              ₱{formatPrice(cafe.total)}
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden ml-6">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${pct}%`, transition: "width 0.7s ease" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
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

      {/* ── Bottom Nav ── */}
      <nav
        aria-label="Main navigation"
        className="md:hidden fixed bottom-0 left-0 w-full bg-surface/90 backdrop-blur-xl flex justify-around items-center px-2 py-2 z-50 shadow-[0_-4px_16px_rgba(48,51,49,0.04)]"
      >
        <Link href="/" className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary transition-all">
          <span className="material-symbols-outlined text-xl">menu_book</span>
          <span className="text-[9px] uppercase tracking-widest font-medium mt-0.5">Journal</span>
        </Link>
        <Link href="/cafes" className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary transition-all">
          <span className="material-symbols-outlined text-xl">store</span>
          <span className="text-[9px] uppercase tracking-widest font-medium mt-0.5">Cafes</span>
        </Link>
        <Link href="/profile/history" className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary transition-all">
          <span className="material-symbols-outlined text-xl">history</span>
          <span className="text-[9px] uppercase tracking-widest font-medium mt-0.5">History</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-lg px-3 py-1 transition-all">
          <span className="material-symbols-outlined text-xl">person</span>
          <span className="text-[9px] uppercase tracking-widest font-bold mt-0.5">Profile</span>
        </Link>
      </nav>
    </>
  );
}
