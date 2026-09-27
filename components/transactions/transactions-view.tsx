"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { filterTransactions } from "@/lib/filters";
import { useIsClient } from "@/lib/use-is-client";
import type { Category, PaymentMethod, Transaction, TransactionFilters } from "@/lib/types";
import { ExpenseDialog } from "@/components/transactions/expense-dialog";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { buttonClass, ghostButtonClass, inputClass, panelClass } from "@/components/ui";

export function TransactionsView({
  transactions,
  categories,
  paymentMethods,
  currency,
  filters,
}: {
  transactions: Transaction[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  currency: string;
  filters: TransactionFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isClient = useIsClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const close = useCallback(() => {
    setOpen(false);
    setEditing(null);
  }, []);

  const visible = useMemo(() => {
    if (!isClient) return [];
    return filterTransactions(transactions, filters);
  }, [filters, isClient, transactions]);

  const methods = useMemo(() => {
    return [...new Set(transactions.map((transaction) => transaction.payment_method))];
  }, [transactions]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const key of ["q", "category", "method", "from", "to"]) {
      const value = String(data.get(key) ?? "").trim();
      if (value) params.set(key, value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-slate-400">Newest charges first. Filter, edit, or remove any row.</p>
        </div>
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

      <form
        key={`${filters.q ?? ""}|${filters.category ?? ""}|${filters.method ?? ""}|${filters.from ?? ""}|${filters.to ?? ""}`}
        onSubmit={applyFilters}
        className={`${panelClass} grid gap-3 p-4 md:grid-cols-6`}
      >
        <label className="space-y-1.5 text-sm md:col-span-2">
          <span className="text-slate-400">Search</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-slate-500" />
            <input name="q" defaultValue={filters.q ?? ""} placeholder="Merchant or note" className={`${inputClass} pl-9`} />
          </span>
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="text-slate-400">Category</span>
          <select name="category" defaultValue={filters.category ?? ""} className={inputClass}>
            <option value="">All</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="text-slate-400">Payment</span>
          <select name="method" defaultValue={filters.method ?? ""} className={inputClass}>
            <option value="">All</option>
            {methods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="text-slate-400">From</span>
          <input name="from" type="date" defaultValue={filters.from ?? ""} className={inputClass} />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="text-slate-400">To</span>
          <input name="to" type="date" defaultValue={filters.to ?? ""} className={inputClass} />
        </label>
        <div className="flex items-end gap-2 md:col-span-6">
          <button type="submit" className={buttonClass}>
            Apply filters
          </button>
          <button
            type="button"
            className={ghostButtonClass}
            onClick={() => router.push(pathname)}
          >
            Clear
          </button>
        </div>
      </form>

      {isClient ? (
        <TransactionTable
          transactions={visible}
          categories={categories}
          currency={currency}
          onEdit={(transaction) => {
            setEditing(transaction);
            setOpen(true);
          }}
        />
      ) : (
        <div className={`${panelClass} h-48 animate-pulse`} />
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
