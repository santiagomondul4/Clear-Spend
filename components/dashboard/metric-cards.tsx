import { PiggyBank, Scale, Tags, Wallet } from "lucide-react";
import { panelClass } from "@/components/ui";

const ICONS = [Wallet, PiggyBank, Scale, Tags];

export function MetricCards({
  items,
}: {
  items: { label: string; value: string; hint: string }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => {
        const Icon = ICONS[index] ?? Wallet;
        return (
          <article key={item.label} className={`${panelClass} p-5`}>
            <div className="flex items-center justify-between text-slate-400">
              <p className="text-sm">{item.label}</p>
              <Icon className="h-4 w-4 text-indigo-300" />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-50">{item.value}</p>
            <p className="mt-1 text-xs text-slate-500">{item.hint}</p>
          </article>
        );
      })}
    </div>
  );
}
