"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import {
  buildChart,
  categoryBreakdown,
  monthlyBudgetRows,
  scaleMonthlyBudget,
  sumAmounts,
  topCategoryName,
  transactionsInPeriod,
  getPeriodBounds,
} from "@/lib/analytics";
import { formatMoney } from "@/lib/format";
import { useIsClient } from "@/lib/use-is-client";
import type { Category, PaymentMethod, Period, Transaction } from "@/lib/types";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { MetricCards } from "@/components/dashboard/metric-cards";
import { PeriodToggle } from "@/components/dashboard/period-toggle";
import { SpendChart } from "@/components/dashboard/spend-chart";
import { ExpenseDialog } from "@/components/transactions/expense-dialog";
import { buttonClass, panelClass } from "@/components/ui";

const PERIOD_HINT: Record<Period, string> = {
  daily: "Today",
  weekly: "This week",
  monthly: "This month",
  yearly: "This year",
};

export function DashboardView({
  categories,
  paymentMethods,
  transactions,
  currency,
  generatedAt,
}: {
  categories: Category[];
  paymentMethods: PaymentMethod[];
  transactions: Transaction[];
  currency: string;
  generatedAt: string;
}) {
  const isClient = useIsClient();
  const [period, setPeriod] = useState<Period>("monthly");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const close = useCallback(() => {
    setOpen(false);
    setEditing(null);
  }, []);
  const now = useMemo(() => new Date(generatedAt), [generatedAt]);

  const monthlyTotal = categories.reduce((sum, category) => sum + category.budget_limit, 0);
  const snapshot = useMemo(() => {
    if (!isClient) return null;
    const bounds = getPeriodBounds(period, now);
    const periodTransactions = transactionsInPeriod(transactions, bounds.start, bounds.end);
    const spent = sumAmounts(periodTransactions);
    const budget = scaleMonthlyBudget(monthlyTotal, period, now);
    return {
      spent,
      budget,
      remaining: budget - spent,
      top: topCategoryName(periodTransactions, categories),
      chart: buildChart(transactions, monthlyTotal, period, now),
      slices: categoryBreakdown(periodTransactions, categories),
      rows: monthlyBudgetRows(categories, transactions, now),
    };
  }, [categories, isClient, monthlyTotal, now, period, transactions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-slate-400">Spending against your category budgets.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodToggle value={period} onChange={setPeriod} />
          <button
            type="button"
            className={buttonClass}
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add expense
          </button>
        </div>
      </div>

      {snapshot ? (
        <>
          <MetricCards
            items={[
              {
                label: "Total spent",
                value: formatMoney(snapshot.spent, currency),
                hint: PERIOD_HINT[period],
              },
              {
                label: "Budget limit",
                value: formatMoney(snapshot.budget, currency),
                hint: "Scaled from monthly category targets",
              },
              {
                label: "Remaining",
                value: formatMoney(snapshot.remaining, currency),
                hint: snapshot.remaining < 0 ? "Over budget" : "Left in this period",
              },
              {
                label: "Top category",
                value: snapshot.top,
                hint: "Highest spend in this period",
              },
            ]}
          />

          <div className="grid gap-4 xl:grid-cols-5">
            <section className={`${panelClass} p-5 xl:col-span-3`}>
              <h2 className="mb-4 font-medium">Spending vs budget</h2>
              <SpendChart points={snapshot.chart} currency={currency} />
            </section>
            <section className={`${panelClass} p-5 xl:col-span-2`}>
              <h2 className="mb-2 font-medium">By category</h2>
              <CategoryDonut slices={snapshot.slices} currency={currency} />
            </section>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Category budgets</h2>
            <BudgetProgress rows={snapshot.rows} currency={currency} />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Recent purchases</h2>
              <Link href="/dashboard/transactions" className="text-sm text-indigo-300 hover:text-indigo-200">
                View all
              </Link>
            </div>
            <TransactionTable
              transactions={transactions.slice(0, 8)}
              categories={categories}
              currency={currency}
              emptyMessage="No purchases yet. Add an expense, then use Edit on that row."
              onEdit={(transaction) => {
                setEditing(transaction);
                setOpen(true);
              }}
            />
          </section>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className={`${panelClass} h-28 animate-pulse`} />
          ))}
        </div>
      )}

      <ExpenseDialog
        categories={categories}
        paymentMethods={paymentMethods}
        open={open}
        transaction={editing}
        onClose={close}
      />
    </div>
  );
}
