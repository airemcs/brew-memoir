"use client";

import Link from "next/link";
import DeleteCafeButton from "./DeleteCafeButton";

export default function CafeDetailHeader({
  cafeId,
  totalEntries,
}: {
  cafeId: string;
  totalEntries: number;
}) {
  return (
    <header className="w-full bg-surface flex justify-between items-center px-6 py-4">
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
      <DeleteCafeButton cafeId={cafeId} totalEntries={totalEntries} />
    </header>
  );
}
