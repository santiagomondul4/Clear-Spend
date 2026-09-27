import type { Transaction, TransactionFilters } from "@/lib/types";

function one(value: string | string[] | undefined) {
  const picked = Array.isArray(value) ? value[0] : value;
  const trimmed = picked?.trim();
  return trimmed ? trimmed : undefined;
}

export function readFilters(params: {
  [key: string]: string | string[] | undefined;
}): TransactionFilters {
  return {
    q: one(params.q),
    category: one(params.category),
    method: one(params.method),
    from: one(params.from),
    to: one(params.to),
  };
}

function parseLocalDay(value: string, endExclusive: boolean) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, endExclusive ? day + 1 : day);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function filterTransactions(transactions: Transaction[], filters: TransactionFilters) {
  const query = filters.q?.toLowerCase() ?? "";
  const from = filters.from ? parseLocalDay(filters.from, false) : null;
  const to = filters.to ? parseLocalDay(filters.to, true) : null;

  return transactions.filter((transaction) => {
    if (filters.category && transaction.category_id !== filters.category) return false;
    if (filters.method && transaction.payment_method !== filters.method) return false;
    if (query) {
      const haystack = `${transaction.title} ${transaction.notes ?? ""}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    const time = new Date(transaction.transaction_date).getTime();
    if (from && time < from.getTime()) return false;
    if (to && time >= to.getTime()) return false;
    return true;
  });
}
