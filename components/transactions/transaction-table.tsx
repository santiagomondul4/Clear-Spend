"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { deleteTransaction } from "@/lib/actions/transactions";
import { CategoryIcon } from "@/components/category-icon";
import { formatMoney, formatTimestamp } from "@/lib/format";
import type { Category, Transaction } from "@/lib/types";
import { ghostButtonClass } from "@/components/ui";

export function TransactionTable({
  transactions,
  categories,
  currency,
  onEdit,
  emptyMessage = "No transactions match these filters.",
}: {
  transactions: Transaction[];
  categories: Category[];
  currency: string;
  onEdit: (transaction: Transaction) => void;
  emptyMessage?: string;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const categoriesById = new Map(categories.map((category) => [category.id, category]));

  function remove(id: string) {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await deleteTransaction(id);
      setPendingId(null);
      setConfirmId(null);
      if (result.error) setError(result.error);
    });
  }

  if (transactions.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-400">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p role="alert" className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
      <ul className="space-y-2">
        {transactions.map((transaction) => {
          const category = categoriesById.get(transaction.category_id);
          return (
            <li
              key={transaction.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
            >
              <div className="min-w-0 space-y-1">
                <p className="font-medium text-slate-100">{transaction.title}</p>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                  <time dateTime={transaction.transaction_date} suppressHydrationWarning>
                    {formatTimestamp(transaction.transaction_date)}
                  </time>
                  <span className="inline-flex items-center gap-1.5 text-slate-300">
                    <CategoryIcon name={category?.icon_name ?? "MoreHorizontal"} />
                    {category?.name ?? "Uncategorized"}
                  </span>
                  <span>{transaction.payment_method}</span>
                </p>
                {transaction.notes ? (
                  <p className="max-w-md truncate text-xs text-slate-500">{transaction.notes}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <p className="mr-1 font-medium whitespace-nowrap text-slate-50">
                  {formatMoney(transaction.amount, currency)}
                </p>
                {confirmId === transaction.id ? (
                  <>
                    <button
                      type="button"
                      className="text-xs text-rose-300"
                      disabled={pending && pendingId === transaction.id}
                      onClick={() => remove(transaction.id)}
                    >
                      {pending && pendingId === transaction.id ? "Deleting…" : "Confirm"}
                    </button>
                    <button
                      type="button"
                      className="text-xs text-slate-400"
                      onClick={() => setConfirmId(null)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className={ghostButtonClass}
                      onClick={() => onEdit(transaction)}
                      aria-label={`Edit ${transaction.title}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      className={ghostButtonClass}
                      onClick={() => setConfirmId(transaction.id)}
                      aria-label={`Delete ${transaction.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
