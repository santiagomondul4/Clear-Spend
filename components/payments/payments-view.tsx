"use client";

import { useMemo, useState } from "react";
import { Banknote, ChevronLeft, ChevronRight, CreditCard, Landmark } from "lucide-react";
import { chargeGroups, monthBounds, monthLabel, shiftMonth } from "@/lib/payments";
import { formatMoney, formatTimestamp } from "@/lib/format";
import { useIsClient } from "@/lib/use-is-client";
import type { Category, PaymentMethod, Transaction } from "@/lib/types";
import { ghostButtonClass, panelClass } from "@/components/ui";

export function PaymentsView({
  transactions,
  categories,
  paymentMethods,
  currency,
  generatedAt,
}: {
  transactions: Transaction[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  currency: string;
  generatedAt: string;
}) {
  const isClient = useIsClient();
  const [month, setMonth] = useState(() => new Date(generatedAt));
  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const snapshot = useMemo(() => {
    if (!isClient) return null;
    const { start, end } = monthBounds(month);
    const creditNames = paymentMethods.filter((method) => method.kind === "credit").map((method) => method.name);
    const debitNames = paymentMethods.filter((method) => method.kind === "debit").map((method) => method.name);
    const credit = chargeGroups(transactions, "credit", start, end, creditNames);
    const debit = chargeGroups(transactions, "debit", start, end, debitNames);
    const cash = chargeGroups(transactions, "cash", start, end);
    return {
      credit,
      debit,
      cash,
      creditDue: credit.reduce((sum, group) => sum + group.total, 0),
      debitSpent: debit.reduce((sum, group) => sum + group.total, 0),
      cashSpent: cash.reduce((sum, group) => sum + group.total, 0),
    };
  }, [isClient, month, paymentMethods, transactions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
          <p className="text-sm text-slate-400">
            Credit card bills, debit charges, and cash for the month you pick.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={ghostButtonClass}
            onClick={() => setMonth((current) => shiftMonth(current, -1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="min-w-36 text-center text-sm font-medium text-slate-100">{monthLabel(month)}</p>
          <button
            type="button"
            className={ghostButtonClass}
            onClick={() => setMonth((current) => shiftMonth(current, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {snapshot ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Summary
              icon={CreditCard}
              label="Credit bill"
              value={formatMoney(snapshot.creditDue, currency)}
              hint="Estimated amount due"
            />
            <Summary
              icon={Landmark}
              label="Debit spent"
              value={formatMoney(snapshot.debitSpent, currency)}
              hint="Left your bank account"
            />
            <Summary
              icon={Banknote}
              label="Cash spent"
              value={formatMoney(snapshot.cashSpent, currency)}
              hint="Paid in cash"
            />
          </div>

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Credit cards</h2>
              <p className="text-sm text-slate-400">
                Each card is a statement built from the purchases you logged. It is an estimate, not a bill from your bank.
              </p>
            </div>
            {snapshot.credit.length === 0 ? (
              <Empty message="No credit cards yet. Choose Credit on an expense and save a card name." />
            ) : (
              snapshot.credit.map((group) => (
                <Statement
                  key={`credit-${group.name}`}
                  eyebrow="Credit card"
                  title={group.name}
                  period={`${monthLabel(month)} statement`}
                  totalLabel="Amount due"
                  total={formatMoney(group.total, currency)}
                  charges={group.charges}
                  categoriesById={categoriesById}
                  currency={currency}
                  empty="No charges on this statement."
                />
              ))
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Debit cards</h2>
            {snapshot.debit.length === 0 ? (
              <Empty message="No debit cards yet. Choose Debit on an expense and save a card name." />
            ) : (
              snapshot.debit.map((group) => (
                <Statement
                  key={`debit-${group.name}`}
                  eyebrow="Debit card"
                  title={group.name}
                  period={monthLabel(month)}
                  totalLabel="Spent"
                  total={formatMoney(group.total, currency)}
                  charges={group.charges}
                  categoriesById={categoriesById}
                  currency={currency}
                  empty="No debit charges this month."
                />
              ))
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Cash</h2>
            {snapshot.cash.length === 0 ? (
              <Empty message="No cash purchases this month." />
            ) : (
              snapshot.cash.map((group) => (
                <Statement
                  key="cash"
                  eyebrow="Cash"
                  title="Cash purchases"
                  period={monthLabel(month)}
                  totalLabel="Spent"
                  total={formatMoney(group.total, currency)}
                  charges={group.charges}
                  categoriesById={categoriesById}
                  currency={currency}
                  empty="No cash purchases this month."
                />
              ))
            )}
          </section>
        </>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className={`${panelClass} h-28 animate-pulse`} />
          ))}
        </div>
      )}
    </div>
  );
}

function Summary({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof CreditCard;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className={`${panelClass} p-5`}>
      <div className="flex items-center justify-between text-slate-400">
        <p className="text-sm">{label}</p>
        <Icon className="h-4 w-4 text-indigo-300" />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-50">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </article>
  );
}

function Statement({
  eyebrow,
  title,
  period,
  totalLabel,
  total,
  charges,
  categoriesById,
  currency,
  empty,
}: {
  eyebrow: string;
  title: string;
  period: string;
  totalLabel: string;
  total: string;
  charges: Transaction[];
  categoriesById: Map<string, string>;
  currency: string;
  empty: string;
}) {
  return (
    <article className={panelClass}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-xs tracking-wide text-indigo-300 uppercase">{eyebrow}</p>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-slate-400">{period}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">{totalLabel}</p>
          <p className="text-2xl font-semibold tracking-tight text-slate-50">{total}</p>
        </div>
      </header>
      {charges.length === 0 ? (
        <p className="px-5 py-8 text-sm text-slate-400">{empty}</p>
      ) : (
        <ul>
          {charges.map((charge) => (
            <li
              key={charge.id}
              className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 px-5 py-3 text-sm first:border-t-0"
            >
              <div>
                <p className="font-medium text-slate-100">{charge.title}</p>
                <p className="text-xs text-slate-400">
                  <time dateTime={charge.transaction_date}>{formatTimestamp(charge.transaction_date)}</time>
                  {" · "}
                  {categoriesById.get(charge.category_id) ?? "Uncategorized"}
                </p>
              </div>
              <p className="font-medium text-slate-50">{formatMoney(charge.amount, currency)}</p>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-400">
      {message}
    </p>
  );
}
