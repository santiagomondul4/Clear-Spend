"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";
import { useTheme } from "@/components/theme/theme-provider";

export function SpendChart({
  points,
  currency,
}: {
  points: ChartPoint[];
  currency: string;
}) {
  const { theme } = useTheme();
  const light = theme === "light";
  const tick = light ? "#64748b" : "#94a3b8";

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={light ? "rgba(15,23,42,0.08)" : "rgba(148,163,184,0.12)"} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: tick, fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={16} />
          <YAxis
            tick={{ fill: tick, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={56}
            tickFormatter={(value: number) => formatMoney(value, currency)}
          />
          <Tooltip
            contentStyle={{
              background: light ? "#ffffff" : "#0f172a",
              border: light ? "1px solid rgba(15,23,42,0.12)" : "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              color: light ? "#0f172a" : "#f8fafc",
            }}
            formatter={(value, name) => [
              formatMoney(Number(value ?? 0), currency),
              name === "spent" ? "Spent" : "Budget goal",
            ]}
          />
          <Area
            type="monotone"
            dataKey="budget"
            name="budget"
            stroke="#818cf8"
            fill="rgba(129,140,248,0.18)"
            strokeWidth={2}
          />
          <Bar dataKey="spent" name="spent" fill={light ? "#6366f1" : "#c4b5fd"} radius={[6, 6, 0, 0]} maxBarSize={28} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
