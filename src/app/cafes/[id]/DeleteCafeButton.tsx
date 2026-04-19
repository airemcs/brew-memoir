"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DeleteCafeButton({ cafeId, totalEntries }: { cafeId: string; totalEntries: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const fab = document.querySelector<HTMLElement>('[aria-label="Add new entry"]');
    if (fab) fab.style.display = open ? "none" : "";
    return () => {
      document.body.style.overflow = "";
      if (fab) fab.style.display = "";
    };
  }, [open]);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/cafes/${cafeId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/cafes");
      router.refresh();
    } else {
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <>
      <button
        aria-label="Delete cafe"
        onClick={() => setOpen(true)}
        className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant hover:text-error"
      >
        <span className="material-symbols-outlined text-xl">delete</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-60 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-on-background/40 backdrop-blur-sm"
            onClick={() => !loading && setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg mx-auto bg-surface-container-lowest rounded-t-[2.5rem] shadow-[0_-8px_48px_rgba(48,51,49,0.12)] px-8 pt-6 pb-28 md:pb-12 space-y-8">
            <div className="w-12 h-1 bg-outline-variant/30 rounded-full mx-auto" />

            <div className="space-y-1">
              <h2 className="text-xl font-extrabold tracking-tight text-on-background">
                Delete Cafe?
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                This will permanently remove{" "}
                <span className="font-bold text-on-surface">
                  {totalEntries} {totalEntries === 1 ? "brew log" : "brew logs"}
                </span>{" "}
                along with the cafe. This cannot be undone.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="w-full py-4 rounded-xl bg-error text-white font-bold text-sm tracking-widest uppercase hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                    Deleting…
                  </>
                ) : (
                  "Delete Cafe"
                )}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="w-full py-4 rounded-xl bg-surface-container text-on-surface font-bold text-sm hover:bg-surface-container-high transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
