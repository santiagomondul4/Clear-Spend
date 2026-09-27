"use client";

import { PERIODS } from "@/lib/constants";
import type { Period } from "@/lib/types";

export function PeriodToggle({
  value,
  onChange,
}: {
  value: Period;
  onChange: (period: Period) => void;
}) {
  return (
    <div
      className="flex rounded-xl border border-white/10 bg-slate-950/60 p-1"
      role="tablist"
      aria-label="Time range"
    >
      {PERIODS.map((period) => {
        const selected = value === period.id;
        return (
          <button
            key={period.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(period.id)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              selected ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-slate-100"
            }`}
          >
            {period.label}
          </button>
        );
      })}
    </div>
  );
}
