"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell } from "recharts";

const COLORS = [
  "#79573f", "#9e6d52", "#6e5b4d", "#6a5f38",
  "#a68b5b", "#c4956a", "#9e422c", "#b08870",
];

type Slice = { category: string; percentage: number; count: number };

export default function CategoryDonut({ slices }: { slices: Slice[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const top = slices[0];

  return (
    <div className="flex items-center gap-5">
      {/* Donut */}
      <div className="relative shrink-0">
        {mounted && (
          <PieChart width={96} height={96}>
            <Pie
              data={slices}
              cx={43}
              cy={43}
              innerRadius={30}
              outerRadius={44}
              paddingAngle={2}
              dataKey="percentage"
              strokeWidth={0}
            >
              {slices.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        )}
        {/* centre label */}
        {top && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[11px] font-extrabold text-on-surface leading-none">
              {top.percentage}%
            </span>
          </div>
        )}
      </div>

      {/* Legend — top 4 */}
      <div className="flex flex-col gap-1.5">
        {slices.slice(0, 4).map((s, i) => (
          <div key={s.category} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="text-[10px] font-medium text-on-surface-variant truncate max-w-24">
              {s.category}
            </span>
            <span className="text-[10px] font-bold text-on-surface ml-auto pl-2">
              {s.percentage}%
            </span>
          </div>
        ))}
        {slices.length > 4 && (
          <span className="text-[10px] text-on-surface-variant/50 pl-3.5">
            +{slices.length - 4} more
          </span>
        )}
      </div>
    </div>
  );
}
