"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteEntryButton({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/entries/${entryId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-on-surface-variant mr-1">Delete?</span>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-1.5 rounded-full text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-3 py-1.5 rounded-full text-xs font-bold bg-error text-white hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {loading ? "Deleting…" : "Confirm"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      aria-label="Delete entry"
      className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant hover:text-error"
    >
      <span className="material-symbols-outlined text-xl">delete</span>
    </button>
  );
}
