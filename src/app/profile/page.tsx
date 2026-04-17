"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { BEVERAGE_CATEGORIES, TASTING_NOTES } from "@/types";
import type { BeverageCategory } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMemberSince(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const CURRENCIES = [
  { code: "PHP", symbol: "₱", label: "Philippine Peso" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
];

// ---------------------------------------------------------------------------
// Bottom sheet wrapper
// ---------------------------------------------------------------------------

function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex flex-col justify-end">
      {/* Scrim */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      {/* Sheet */}
      <div className="relative bg-surface rounded-t-3xl w-full max-w-2xl mx-auto px-6 pt-5 pb-10 flex flex-col gap-5 animate-[slideUp_220ms_ease-out]">
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full bg-outline-variant/40 mx-auto -mt-1" />
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold tracking-[-0.02em] text-on-surface">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-xl">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProfilePage() {
  // Lock page scroll — content fits the viewport
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = ""; };
  }, []);

  // User identity
  const [userName, setUserName] = useState("");
  const [memberSince, setMemberSince] = useState("");

  // Budget
  const [budget, setBudget] = useState<number>(2_000);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState("");
  const [notificationsOn, setNotificationsOn] = useState(true);

  // Currency sheet
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [currencyOpen, setCurrencyOpen] = useState(false);

  // Load user info + preferences on mount
  useEffect(() => {
    fetch("/api/user/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        setUserName(data.name ?? "");
        setMemberSince(data.memberSince ? formatMemberSince(data.memberSince) : "");
      });

    fetch("/api/user/preferences")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        if (data.monthlyBudget !== undefined) {
          setBudget(data.monthlyBudget);
          setBudgetDraft(data.monthlyBudget.toString());
        }
        if (data.currency) {
          const found = CURRENCIES.find((c) => c.code === data.currency);
          if (found) setCurrency(found);
        }
      });
  }, []);

  // Default category sheet
  const [defaultCategory, setDefaultCategory] = useState<BeverageCategory>("Matcha");
  const [categoryOpen, setCategoryOpen] = useState(false);

  // Tasting note presets sheet
  const [notePresets, setNotePresets] = useState<string[]>([...TASTING_NOTES]);
  const [presetsOpen, setPresetsOpen] = useState(false);

  function commitBudget() {
    const parsed = parseFloat(budgetDraft.replace(/,/g, ""));
    if (!isNaN(parsed) && parsed > 0) {
      setBudget(parsed);
      fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyBudget: parsed }),
      });
    } else {
      setBudgetDraft(budget.toString());
    }
    setEditingBudget(false);
  }

  function selectCurrency(c: typeof CURRENCIES[number]) {
    setCurrency(c);
    setCurrencyOpen(false);
    fetch("/api/user/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: c.code }),
    });
  }

  function toggleNote(note: string) {
    setNotePresets((prev) =>
      prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note]
    );
  }

  // Preview circles: first 3 selected notes
  const previewNotes = notePresets.slice(0, 3);
  const extraCount = notePresets.length - previewNotes.length;

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
          <Link href="/profile/history" className="text-on-surface-variant text-[10px] uppercase tracking-widest hover:text-primary transition-colors">
            History
          </Link>
          <Link href="/profile" className="text-primary text-[10px] uppercase tracking-widest">
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

      {/* ── Main ── */}
      <main className="pt-16 pb-16 md:pb-0 px-6 max-w-2xl mx-auto flex flex-col gap-6">

        {/* User identity */}
        <section className="pt-6 flex flex-col gap-1">
          <h2 className="text-3xl font-extrabold tracking-[-0.02em] text-on-surface">
            {userName || "—"}
          </h2>
          <p className="text-sm text-on-surface-variant flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            {memberSince ? `Taster since ${memberSince}` : ""}
          </p>
        </section>

        {/* ── Financials ── */}
        <section className="flex flex-col gap-1">
          <span className="text-[0.6875rem] uppercase tracking-[0.15em] font-bold text-on-surface-variant px-1">
            Financials
          </span>
          <div className="bg-surface-container-low rounded-2xl overflow-hidden">
            {/* Currency */}
            <button
              onClick={() => setCurrencyOpen(true)}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-outline-variant/20 hover:bg-surface-container/50 transition-colors"
            >
              <span className="text-sm font-medium text-on-surface">Currency</span>
              <span className="flex items-center gap-1 text-sm font-semibold text-on-surface">
                {currency.code}
                <span className="material-symbols-outlined text-on-surface-variant text-base">chevron_right</span>
              </span>
            </button>

            {/* Monthly Budget */}
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm font-medium text-on-surface">Monthly Budget</span>
              <div className="flex items-center gap-2">
                {editingBudget ? (
                  <input
                    autoFocus
                    type="number"
                    min="0"
                    value={budgetDraft}
                    onChange={(e) => setBudgetDraft(e.target.value)}
                    onBlur={commitBudget}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitBudget();
                      if (e.key === "Escape") {
                        setBudgetDraft(budget.toString());
                        setEditingBudget(false);
                      }
                    }}
                    className="w-28 text-right text-sm font-semibold text-on-surface bg-surface-container rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
                  />
                ) : (
                  <span className="text-sm font-semibold text-on-surface">
                    {currency.symbol}{budget.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
                <button
                  onClick={() => {
                    setBudgetDraft(budget.toString());
                    setEditingBudget(true);
                  }}
                  aria-label="Edit budget"
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Preferences ── */}
        <section className="flex flex-col gap-1">
          <span className="text-[0.6875rem] uppercase tracking-[0.15em] font-bold text-on-surface-variant px-1">
            Preferences
          </span>
          <div className="bg-surface-container-low rounded-2xl overflow-hidden">
            {/* Default Category */}
            <button
              onClick={() => setCategoryOpen(true)}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-outline-variant/20 hover:bg-surface-container/50 transition-colors"
            >
              <span className="text-sm font-medium text-on-surface">Default Category</span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container">
                {defaultCategory}
              </span>
            </button>

            {/* Tasting Note Presets */}
            <button
              onClick={() => setPresetsOpen(true)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-container/50 transition-colors"
            >
              <span className="text-sm font-medium text-on-surface">Tasting Note Presets</span>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {previewNotes.map((note, i) => (
                    <span
                      key={note}
                      title={note}
                      className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-[0.5rem] font-bold text-on-surface-variant border-2 border-surface-container-low"
                      style={{ zIndex: 3 - i }}
                    >
                      {note.slice(0, 2).toUpperCase()}
                    </span>
                  ))}
                </div>
                {extraCount > 0 && (
                  <span className="text-xs font-semibold text-on-surface-variant">+{extraCount} more</span>
                )}
              </div>
            </button>
          </div>
        </section>

        {/* ── Account ── */}
        <section className="flex flex-col gap-1">
          <span className="text-[0.6875rem] uppercase tracking-[0.15em] font-bold text-on-surface-variant px-1">
            Account
          </span>
          <div className="bg-surface-container-low rounded-2xl overflow-hidden">
            {/* Notifications */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
              <span className="text-sm font-medium text-on-surface">Notifications</span>
              <button
                role="switch"
                aria-checked={notificationsOn}
                onClick={() => setNotificationsOn((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${notificationsOn ? "bg-primary" : "bg-outline-variant"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${notificationsOn ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
            </div>

            {/* Export Data */}
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm font-medium text-on-surface">Export Data</span>
              <button
                aria-label="Export data"
                className="flex items-center justify-center p-1.5 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant hover:text-primary"
              >
                <span className="material-symbols-outlined text-base">share</span>
              </button>
            </div>
          </div>
        </section>

        {/* Sign Out */}
        <button
          className="w-full py-3.5 rounded-2xl font-bold text-sm tracking-wide text-white bg-linear-to-r from-primary to-primary/80 shadow-md active:scale-[0.98] transition-transform duration-150"
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        >
          Sign Out
        </button>

        {/* Version */}
        <p className="text-center text-[0.6875rem] text-on-surface-variant/50 tracking-wide">
          Brew Memoir v0.1.0
        </p>

      </main>

      {/* ── Bottom Nav (mobile) ── */}
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

      {/* ══════════════════════════════════════════════════
          Currency Sheet
      ══════════════════════════════════════════════════ */}
      <BottomSheet open={currencyOpen} onClose={() => setCurrencyOpen(false)} title="Currency">
        <ul className="flex flex-col gap-1">
          {CURRENCIES.map((c) => {
            const active = c.code === currency.code;
            return (
              <li key={c.code}>
                <button
                  onClick={() => selectCurrency(c)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${active ? "bg-secondary-container" : "hover:bg-surface-container"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-sm font-bold text-on-surface-variant">
                      {c.symbol}
                    </span>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-on-surface">{c.code}</p>
                      <p className="text-xs text-on-surface-variant">{c.label}</p>
                    </div>
                  </div>
                  {active && (
                    <span className="material-symbols-outlined text-primary text-xl filled">check_circle</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </BottomSheet>

      {/* ══════════════════════════════════════════════════
          Default Category Sheet
      ══════════════════════════════════════════════════ */}
      <BottomSheet open={categoryOpen} onClose={() => setCategoryOpen(false)} title="Default Category">
        <div className="flex flex-wrap gap-2 pb-2">
          {BEVERAGE_CATEGORIES.map((cat) => {
            const active = cat === defaultCategory;
            return (
              <button
                key={cat}
                onClick={() => { setDefaultCategory(cat); setCategoryOpen(false); }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  active
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </BottomSheet>

      {/* ══════════════════════════════════════════════════
          Tasting Note Presets Sheet
      ══════════════════════════════════════════════════ */}
      <BottomSheet open={presetsOpen} onClose={() => setPresetsOpen(false)} title="Tasting Note Presets">
        <p className="text-xs text-on-surface-variant -mt-2">
          Select the notes that will appear as quick-picks when logging a new entry.
        </p>
        <div className="flex flex-wrap gap-2 pb-2">
          {TASTING_NOTES.map((note) => {
            const active = notePresets.includes(note);
            return (
              <button
                key={note}
                onClick={() => toggleNote(note)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  active
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {note}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-outline-variant/20">
          <span className="text-xs text-on-surface-variant">{notePresets.length} of {TASTING_NOTES.length} selected</span>
          <div className="flex gap-2">
            <button
              onClick={() => setNotePresets([])}
              className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-container"
            >
              Clear all
            </button>
            <button
              onClick={() => setNotePresets([...TASTING_NOTES])}
              className="text-xs font-semibold text-primary hover:text-primary/70 transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-container"
            >
              Select all
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
