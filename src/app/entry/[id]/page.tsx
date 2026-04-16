import Link from "next/link";
import { notFound } from "next/navigation";
import { Types } from "mongoose";
import type { BeverageCategory, IEntry } from "@/types";
import { connectDB } from "@/lib/db";
import { Entry } from "@/lib/models";
import { getServerUserId } from "@/lib/serverAuth";
import DeleteEntryButton from "./DeleteEntryButton";

// ---------------------------------------------------------------------------
// Data layer
// ---------------------------------------------------------------------------

async function getEntry(id: string): Promise<IEntry | null> {
  if (!Types.ObjectId.isValid(id)) return null;

  const userId = await getServerUserId();
  if (!userId) return null;

  await connectDB();
  const entry = await Entry.findOne({
    _id: new Types.ObjectId(id),
    userId: new Types.ObjectId(userId),
  }).lean();

  if (!entry) return null;

  // Serialize: ObjectId → string, Date → ISO string
  return JSON.parse(JSON.stringify(entry));
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

export default async function EntryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await getEntry(id);
  if (!entry) notFound();

  return (
    <>
      {/* ── Top App Bar ── */}
      <header className="fixed top-0 left-0 w-full z-50 bg-surface flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center justify-center p-2 rounded-full hover:bg-surface-container transition-colors"
            aria-label="Back"
          >
            <span className="material-symbols-outlined text-primary text-xl">arrow_back</span>
          </Link>
          <h1 className="text-base font-bold tracking-[-0.02em] text-primary">Order Details</h1>
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
          <Link href="/profile" className="text-on-surface-variant text-[10px] uppercase tracking-widest hover:text-primary transition-colors">
            Profile
          </Link>
        </nav>

        <DeleteEntryButton entryId={entry._id} />
      </header>

      {/* ── Main ── */}
      <main className="pt-16 pb-32 px-6 max-w-2xl mx-auto flex flex-col gap-8">

        {/* Hero */}
        <section className="flex flex-col gap-5">
          <div className="w-full aspect-square rounded-3xl bg-surface-container-low flex items-center justify-center overflow-hidden">
            {entry.photoUrl ? (
              <img src={entry.photoUrl} alt={entry.beverageName} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">
                {CATEGORY_ICON[entry.category]}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[0.6875rem] uppercase tracking-[0.15em] font-bold text-primary">
              Exclusive Brew
            </span>
            <h2 className="text-3xl font-extrabold tracking-[-0.02em] text-on-surface leading-tight">
              {entry.beverageName}
            </h2>
            <div className="flex items-center gap-2">
              <Stars rating={entry.rating} />
              <span className="text-xs font-semibold text-on-surface-variant">{entry.rating}</span>
            </div>
            <p className="text-2xl font-light text-on-surface tracking-tight">
              ₱{formatPrice(entry.totalPrice)}
            </p>
          </div>
        </section>

        {/* Details grid */}
        <section className="grid grid-cols-1 gap-4">
          {/* Location */}
          <div className="p-6 bg-surface-container-low rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-[0.75rem] uppercase tracking-widest font-bold text-on-surface-variant">
                The Venue
              </span>
              {entry.cafeId ? (
                <Link href={`/cafes/${entry.cafeId}`} className="group flex items-center gap-1 mt-1">
                  <h3 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                    {entry.cafeName}
                  </h3>
                  <span className="material-symbols-outlined text-sm text-on-surface-variant group-hover:text-primary transition-colors">
                    arrow_forward
                  </span>
                </Link>
              ) : (
                <h3 className="text-base font-bold text-on-surface mt-1">{entry.cafeName}</h3>
              )}
              {entry.cafeCity && (
                <p className="text-sm text-on-surface-variant mt-0.5">{entry.cafeCity}</p>
              )}
            </div>

            <hr className="border-outline-variant/20 my-4" />

            <div>
              <span className="text-[0.75rem] uppercase tracking-widest font-bold text-on-surface-variant">
                Journaled On
              </span>
              <h3 className="text-base font-bold text-on-surface mt-1">
                {new Date(entry.date).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
            </div>
          </div>
        </section>

        {/* Sommelier Notes */}
        <section>
          <span className="text-[0.75rem] uppercase tracking-widest font-bold text-on-surface-variant">
            Sommelier Notes
          </span>
          <div className="mt-4 border-l-2 border-primary/10 pl-6 py-2">
            {entry.personalNotes ? (
              <p className="text-sm font-medium text-on-surface-variant italic leading-relaxed">
                &ldquo;{entry.personalNotes}&rdquo;
              </p>
            ) : (
              <p className="text-sm text-on-surface-variant italic font-light">
                No additional notes provided for this session.
              </p>
            )}
          </div>
        </section>

        {/* Transaction details */}
        <section className="py-8 bg-surface-container-low/50 rounded-2xl flex flex-col gap-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-on-surface-variant">Base Price</span>
            <span className="font-medium text-on-surface">₱{formatPrice(entry.basePrice)}</span>
          </div>
          {entry.addOns.map((addon, i) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <span className="text-on-surface-variant">Add-on ({addon.name})</span>
              <span className="font-medium text-on-surface">+₱{formatPrice(addon.price)}</span>
            </div>
          ))}
          <div className="pt-4 border-t border-outline-variant/10 flex justify-between items-center">
            <span className="font-bold text-on-surface">Total</span>
            <span className="text-xl font-extrabold text-primary">₱{formatPrice(entry.totalPrice)}</span>
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
