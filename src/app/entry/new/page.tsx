"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AddOn, AddOnCategory, BeverageCategory } from "@/types";
import { ADDON_CATEGORIES, BEVERAGE_CATEGORIES } from "@/types";

// ---------------------------------------------------------------------------
// Constants
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

// Short labels for the category grid — value stays as the full BeverageCategory
const CATEGORY_LABEL: Record<BeverageCategory, string> = {
  Coffee: "Coffee",
  "Espresso & Milk": "Espresso",
  Matcha: "Matcha",
  Hojicha: "Hojicha",
  Tea: "Tea",
  Chocolate: "Chocolate",
  "Frappe & Blended": "Frappe",
  "Fruit & Refresher": "Refresher",
  Specialty: "Specialty",
};

const ADDON_CATEGORY_ICON: Record<AddOnCategory, string> = {
  alternative: "swap_horiz",
  intensity:   "bolt",
  syrup:       "water_drop",
  temperature: "thermostat",
  topping:     "layers",
  size:        "straighten",
  customization: "tune",
};

// Initial add-ons shown before the user adds more
const INITIAL_ADDONS: AddOn[] = [
  { name: "Oat Milk",    category: "alternative", price: 60 },
  { name: "Extra Shot",  category: "intensity",   price: 50 },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {Array.from({ length: 5 }, (_, i) => {
        const full = display >= i + 1;
        const half = !full && display >= i + 0.5;
        return (
          <span
            key={i}
            className="relative w-9 h-9 flex items-center justify-center cursor-pointer"
          >
            <span
              className={`material-symbols-outlined text-3xl select-none ${
                full ? "filled text-primary" : half ? "text-primary" : "text-outline-variant/40"
              }`}
            >
              {full ? "star" : half ? "star_half" : "star"}
            </span>
            {/* Left half → half-star */}
            <span
              className="absolute inset-y-0 left-0 w-1/2"
              onMouseEnter={() => setHover(i + 0.5)}
              onClick={() => onChange(i + 0.5)}
            />
            {/* Right half → full star */}
            <span
              className="absolute inset-y-0 right-0 w-1/2"
              onMouseEnter={() => setHover(i + 1)}
              onClick={() => onChange(i + 1)}
            />
          </span>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function NewEntryPage() {
  const [category, setCategory] = useState<BeverageCategory | null>(null);
  const [rating, setRating] = useState(0);
  const [addOns, setAddOns] = useState<AddOn[]>(INITIAL_ADDONS);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetCategory, setSheetCategory] = useState<AddOnCategory>("alternative");
  const [sheetName, setSheetName] = useState("");
  const [sheetPrice, setSheetPrice] = useState("");

  useEffect(() => {
    document.body.style.overflow = showSheet ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showSheet]);

  function handleAddAddon() {
    if (!sheetName.trim()) return;
    const price = parseFloat(sheetPrice) || 0;
    setAddOns((prev) => [...prev, { name: sheetName.trim(), category: sheetCategory, price }]);
    setShowSheet(false);
    setSheetName("");
    setSheetPrice("");
    setSheetCategory("alternative");
  }

  return (
    <>
      {/* ── Top App Bar ── */}
      <header className="fixed top-0 left-0 w-full z-50 bg-surface flex justify-between items-center px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">local_cafe</span>
          <h1 className="text-base font-bold tracking-[-0.02em] text-primary">Brew Memoir</h1>
        </div>

        <nav className="hidden md:flex gap-6 items-center">
          <Link
            href="/"
            className="text-on-surface-variant text-[10px] uppercase tracking-widest hover:text-primary transition-colors"
          >
            Journal
          </Link>
          <Link
            href="/cafes"
            className="text-on-surface-variant text-[10px] uppercase tracking-widest hover:text-primary transition-colors"
          >
            Cafes
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
      <main className="pt-16 pb-32 px-8 max-w-xl mx-auto">

        {/* Editorial Header */}
        <div className="mb-12 pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors mb-4"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span className="text-[0.6875rem] font-semibold uppercase tracking-widest">Back</span>
          </Link>
          <span className="text-[0.6875rem] uppercase tracking-widest font-semibold text-primary mb-2 block">
            New Entry
          </span>
          <h2 className="text-4xl font-extrabold tracking-[-0.02em] text-on-surface">
            The Ritual Log
          </h2>
          <p className="text-on-surface-variant mt-2 text-sm leading-relaxed">
            Capture the essence of your brew. Note the subtle nuances, the body, and the moment.
          </p>
        </div>

        <form className="space-y-12" onSubmit={(e) => e.preventDefault()}>

          {/* Category */}
          <section>
            <label className="text-[0.75rem] uppercase tracking-widest font-bold text-on-surface-variant block mb-4">
              Category
            </label>
            <div className="grid grid-cols-3 gap-3">
              {BEVERAGE_CATEGORIES.map((cat) => {
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex flex-col items-center justify-center p-5 rounded-xl transition-all duration-200 ${
                      active
                        ? "bg-surface-container-lowest border-2 border-primary text-primary"
                        : "bg-surface-container-low hover:bg-surface-container-high border-2 border-transparent text-on-surface-variant"
                    }`}
                  >
                    <span className="material-symbols-outlined text-3xl mb-2">
                      {CATEGORY_ICON[cat]}
                    </span>
                    <span className="text-sm font-semibold">{CATEGORY_LABEL[cat]}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Basic Info */}
          <section className="space-y-8">
            <div>
              <label className="text-[0.75rem] uppercase tracking-widest font-bold text-on-surface-variant block mb-1">
                Beverage Name
              </label>
              <input
                type="text"
                placeholder="Ethiopia Yirgacheffe V60"
                className="w-full bg-transparent border-0 border-b border-outline-variant/30 focus:border-primary focus:ring-0 focus:outline-none py-3 px-0 text-xl font-medium placeholder:text-outline-variant/50 transition-colors duration-300"
              />
            </div>

            <div>
              <label className="text-[0.75rem] uppercase tracking-widest font-bold text-on-surface-variant block mb-1">
                Cafe Name
              </label>
              <input
                type="text"
                placeholder="Yardstick Coffee"
                className="w-full bg-transparent border-0 border-b border-outline-variant/30 focus:border-primary focus:ring-0 focus:outline-none py-3 px-0 text-xl font-medium placeholder:text-outline-variant/50 transition-colors duration-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="text-[0.75rem] uppercase tracking-widest font-bold text-on-surface-variant block mb-1">
                  Date
                </label>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full bg-transparent border-0 border-b border-outline-variant/30 focus:border-primary focus:ring-0 focus:outline-none py-2 px-0 text-base font-medium transition-colors"
                />
              </div>
              <div>
                <label className="text-[0.75rem] uppercase tracking-widest font-bold text-on-surface-variant block mb-1">
                  Base Price
                </label>
                <div className="flex items-center border-b border-outline-variant/30 focus-within:border-primary transition-colors">
                  <span className="text-outline-variant mr-1 font-medium py-2">₱</span>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    placeholder="180.00"
                    className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none py-2 px-0 text-base font-medium placeholder:text-outline-variant/50"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Add-ons */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <label className="text-[0.75rem] uppercase tracking-widest font-bold text-on-surface-variant">
                Add-ons
              </label>
              <button
                type="button"
                onClick={() => setShowSheet(true)}
                className="text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:opacity-70 transition-opacity"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Add New
              </button>
            </div>
            <div className="space-y-3">
              {addOns.map((addon, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary">
                      {ADDON_CATEGORY_ICON[addon.category]}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{addon.name}</span>
                      <span className="text-xs text-on-surface-variant capitalize">
                        {addon.category === "alternative" ? "Milk Alternative" : addon.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-on-surface-variant self-center">
                      +₱{addon.price.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAddOns((prev) => prev.filter((_, i) => i !== idx))}
                      className="flex items-center text-on-surface-variant hover:text-error transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Rating */}
          <section className="flex flex-col items-center gap-4">
            <label className="text-[0.75rem] uppercase tracking-widest font-bold text-on-surface-variant">
              Star Rating
            </label>
            <StarRating value={rating} onChange={setRating} />
            {rating > 0 && (
              <p className="text-xs text-on-surface-variant">{rating} / 5</p>
            )}
          </section>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              className=" w-full py-5 rounded-xl bg-linear-to-br from-primary to-primary-dim text-on-primary font-bold tracking-widest uppercase text-sm shadow-xl active:scale-[0.98] transition-all duration-300"
            >
              Seal the Log Entry
            </button>
          </div>

        </form>
      </main>

      {/* ── Add-on Sheet ── */}
      {showSheet && (
        <div className="fixed inset-0 z-60 flex flex-col justify-end">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-on-background/40 backdrop-blur-sm"
            onClick={() => setShowSheet(false)}
          />

          {/* Sheet */}
          <div className="relative z-10 w-full max-w-lg mx-auto bg-surface-container-lowest rounded-t-[2.5rem] shadow-[0_-8px_48px_rgba(48,51,49,0.12)] px-8 pt-6 pb-12 space-y-8">
            {/* Drag handle */}
            <div className="w-12 h-1 bg-outline-variant/30 rounded-full mx-auto" />

            {/* Header */}
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-on-background">
                Add Upgrade
              </h2>
              <p className="text-sm text-on-surface-variant font-medium">
                Customize your brew profile with artisanal enhancements.
              </p>
            </div>

            {/* Category chips */}
            <div className="space-y-3">
              <label className="text-[0.6875rem] uppercase tracking-widest font-bold text-on-surface-variant block">
                Upgrade Category
              </label>
              <div className="flex flex-wrap gap-2">
                {ADDON_CATEGORIES.filter((cat) => cat !== "customization").map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSheetCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                      sheetCategory === cat
                        ? "bg-secondary-container text-on-secondary-container border border-primary/10"
                        : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    {cat === "alternative" ? "Milk Alternative" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Item name */}
            <div className="relative group">
              <label className="text-[0.6875rem] uppercase tracking-widest font-bold text-on-surface-variant block mb-1">
                Item Name
              </label>
              <input
                type="text"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                placeholder="e.g., Oat Milk, Extra Shot"
                className="w-full bg-transparent border-0 border-b border-outline-variant/30 py-3 text-lg font-medium placeholder:text-outline-variant/50 focus:ring-0 focus:outline-none focus:border-primary transition-colors"
              />
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-linear-to-r from-primary to-primary-dim transition-all duration-300 group-focus-within:w-full" />
            </div>

            {/* Price */}
            <div className="relative group">
              <label className="text-[0.6875rem] uppercase tracking-widest font-bold text-on-surface-variant block mb-1">
                Price (Optional)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium text-on-surface">₱</span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={sheetPrice}
                  onChange={(e) => setSheetPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent border-0 border-b border-outline-variant/30 py-3 text-lg font-medium placeholder:text-outline-variant/50 focus:ring-0 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-linear-to-r from-primary to-primary-dim transition-all duration-300 group-focus-within:w-full" />
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => setShowSheet(false)}
                className="flex-1 py-4 rounded-xl bg-surface-container-high text-primary font-bold text-sm uppercase tracking-widest hover:bg-surface-variant active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddAddon}
                className="flex-1 py-4 rounded-xl bg-linear-to-br from-primary to-primary-dim text-on-primary font-bold text-sm uppercase tracking-widest shadow-lg active:scale-[0.98] hover:opacity-90 transition-all"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

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
