"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

export default function DeleteEntryButton({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  async function handleDelete() {
    setDeleting(true);
    // Replace with: DELETE /api/entries/:id
    await new Promise((r) => setTimeout(r, 600)); // simulate async
    setDeleting(false);
    setOpen(false);
    router.push("/");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Delete entry"
        className="flex items-center justify-center p-2 rounded-full hover:bg-error/10 transition-colors group"
      >
        <span className="material-symbols-outlined text-on-surface-variant text-xl group-hover:text-error transition-colors">
          delete
        </span>
      </button>

      {/* Confirmation sheet — portalled to body to escape header stacking context */}
      {open && createPortal(
        <div className="fixed inset-0 z-200 flex flex-col justify-end">
          {/* Scrim */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => !deleting && setOpen(false)}
            aria-hidden
          />
          {/* Sheet */}
          <div className="relative bg-surface rounded-t-3xl w-full max-w-2xl mx-auto px-6 pt-5 pb-10 flex flex-col gap-5">
            <div className="w-10 h-1 rounded-full bg-outline-variant/40 mx-auto -mt-1" />

            <div className="flex flex-col gap-1 pt-1">
              <h2 className="text-base font-bold tracking-[-0.02em] text-on-surface">
                Delete this entry?
              </h2>
              <p className="text-sm text-on-surface-variant">
                This ritual will be permanently removed from your journal. This action cannot be undone.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-1">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full py-3.5 rounded-2xl font-bold text-sm tracking-wide text-white bg-error active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                    Deleting…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">delete</span>
                    Yes, Delete Entry
                  </>
                )}
              </button>
              <button
                onClick={() => setOpen(false)}
                disabled={deleting}
                className="w-full py-3.5 rounded-2xl font-bold text-sm tracking-wide text-on-surface bg-surface-container hover:bg-surface-container-high active:scale-[0.98] transition-all disabled:opacity-60"
              >
                Keep It
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
