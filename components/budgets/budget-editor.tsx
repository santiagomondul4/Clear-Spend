"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { updateBudgets } from "@/lib/actions/budgets";
import { monthlyBudgetRows } from "@/lib/analytics";
import { useIsClient } from "@/lib/use-is-client";
import type { Category, Transaction } from "@/lib/types";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { buttonClass, inputClass, panelClass } from "@/components/ui";

export function BudgetEditor({
  categories,
  transactions,
  currency,
  generatedAt,
}: {
  categories: Category[];
  transactions: Transaction[];
  currency: string;
  generatedAt: string;
}) {
  const isClient = useIsClient();
  const [limits, setLimits] = useState<Record<string, string>>(() =>
    Object.fromEntries(categories.map((category) => [category.id, String(category.budget_limit)])),
  );
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const rows = useMemo(() => {
    if (!isClient) return [];
    const preview = categories.map((category) => ({
      ...category,
      budget_limit: Number(limits[category.id] ?? category.budget_limit) || 0,
    }));
    return monthlyBudgetRows(preview, transactions, new Date(generatedAt));
  }, [categories, generatedAt, isClient, limits, transactions]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    setStatus(null);
    startTransition(async () => {
      const result = await updateBudgets(formData);
      if (result.error) setError(result.error);
      else setStatus(result.message ?? "Budgets saved.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Monthly budgets</h1>
          <p className="text-sm text-slate-400">
            Set a target for each category. Progress uses spending from this calendar month.
          </p>
        </div>
        <button type="submit" className={buttonClass} disabled={pending}>
          {pending ? "Saving…" : "Save budgets"}
        </button>
      </div>

      {error ? (
        <p role="alert" className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
      {status ? (
        <p role="status" className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {status}
        </p>
      ) : null}

      <div className="grid gap-4">
        {categories.map((category) => (
          <label key={category.id} className={`${panelClass} grid gap-3 p-4 sm:grid-cols-[1fr_180px] sm:items-center`}>
            <span className="font-medium">{category.name}</span>
            <span className="relative">
              <span className="pointer-events-none absolute top-2.5 left-3 text-sm text-slate-500">
                {currency}
              </span>
              <input
                name={`budget:${category.id}`}
                type="number"
                min="0"
                step="0.01"
                required
                value={limits[category.id] ?? "0"}
                onChange={(event) =>
                  setLimits((current) => ({ ...current, [category.id]: event.target.value }))
                }
                className={`${inputClass} pl-7`}
                aria-label={`${category.name} monthly budget`}
              />
            </span>
          </label>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">This month</h2>
        {isClient ? (
          <BudgetProgress rows={rows} currency={currency} />
        ) : (
          <div className={`${panelClass} h-40 animate-pulse`} />
        )}
      </section>
    </form>
  );
}
