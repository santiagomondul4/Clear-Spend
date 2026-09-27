import { budgetTone, spentPercent, type BudgetRow } from "@/lib/analytics";
import { CategoryIcon } from "@/components/category-icon";
import { formatMoney } from "@/lib/format";
import { panelClass } from "@/components/ui";

const BAR: Record<string, string> = {
  ok: "bg-emerald-400",
  warn: "bg-amber-400",
  over: "bg-rose-500",
  empty: "bg-slate-600",
};

const TEXT: Record<string, string> = {
  ok: "text-emerald-300",
  warn: "text-amber-300",
  over: "text-rose-300",
  empty: "text-slate-400",
};

export function BudgetProgress({
  rows,
  currency,
}: {
  rows: BudgetRow[];
  currency: string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {rows.map((row) => {
        const tone = budgetTone(row.spent, row.limit);
        const percent = spentPercent(row.spent, row.limit);
        const width = Math.min(percent, 100);
        return (
          <article key={row.category.id} className={`${panelClass} p-4`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${row.category.color_hex}22`, color: row.category.color_hex }}
                >
                  <CategoryIcon name={row.category.icon_name} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{row.category.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatMoney(row.spent, currency)} of {formatMoney(row.limit, currency)}
                  </p>
                </div>
              </div>
              <p className={`text-sm font-medium ${TEXT[tone]}`}>
                {row.limit <= 0 && row.spent === 0 ? "No limit" : `${percent}%`}
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800" aria-hidden="true">
              <div className={`h-full rounded-full ${BAR[tone]}`} style={{ width: `${width}%` }} />
            </div>
          </article>
        );
      })}
    </div>
  );
}
