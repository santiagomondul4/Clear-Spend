"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatMoney } from "@/lib/format";
import { useTheme } from "@/components/theme/theme-provider";

type Slice = {
  id: string;
  name: string;
  color: string;
  value: number;
};

export function CategoryDonut({
  slices,
  currency,
}: {
  slices: Slice[];
  currency: string;
}) {
  const { theme } = useTheme();
  const light = theme === "light";
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  if (slices.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-slate-500">
        No spending in this period.
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="value" nameKey="name" innerRadius={62} outerRadius={86} paddingAngle={2} stroke="transparent">
              {slices.map((slice) => (
                <Cell key={slice.id} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: light ? "#ffffff" : "#0f172a",
                border: light ? "1px solid rgba(15,23,42,0.12)" : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                color: light ? "#0f172a" : "#f8fafc",
              }}
              formatter={(value) => formatMoney(Number(value ?? 0), currency)}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xs text-slate-500">Spent</p>
            <p className="text-lg font-semibold">{formatMoney(total, currency)}</p>
          </div>
        </div>
      </div>
      <ul className="mt-2 space-y-2">
        {slices.map((slice) => (
          <li key={slice.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-slate-300">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="truncate">{slice.name}</span>
            </span>
            <span className="text-slate-100">{formatMoney(slice.value, currency)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
