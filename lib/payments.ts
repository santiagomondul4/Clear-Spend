import type { PaymentKind, Transaction } from "@/lib/types";

export type ChargeGroup = {
  name: string;
  charges: Transaction[];
  total: number;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatPaymentMethod(kind: PaymentKind, cardName: string | null) {
  if (kind === "cash") return "Cash";
  const label = kind === "credit" ? "Credit" : "Debit";
  return cardName ? `${label} · ${cardName}` : label;
}

export function isCardKind(kind: string): kind is "credit" | "debit" {
  return kind === "credit" || kind === "debit";
}

export function monthLabel(date: Date) {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function monthBounds(date: Date) {
  return {
    start: new Date(date.getFullYear(), date.getMonth(), 1),
    end: new Date(date.getFullYear(), date.getMonth() + 1, 1),
  };
}

export function shiftMonth(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function chargeGroups(
  transactions: Transaction[],
  kind: PaymentKind,
  start: Date,
  end: Date,
  savedNames: string[] = [],
): ChargeGroup[] {
  const period = transactions.filter((transaction) => {
    if (transaction.payment_kind !== kind) return false;
    const time = new Date(transaction.transaction_date).getTime();
    return time >= start.getTime() && time < end.getTime();
  });

  if (kind === "cash") {
    if (period.length === 0) return [];
    const total = period.reduce((sum, transaction) => sum + transaction.amount, 0);
    return [{ name: "Cash", charges: period, total }];
  }

  const names = new Set(savedNames);
  for (const transaction of period) {
    if (transaction.card_name) names.add(transaction.card_name);
  }

  return [...names].sort((a, b) => a.localeCompare(b)).map((name) => {
    const charges = period.filter((transaction) => transaction.card_name === name);
    const total = charges.reduce((sum, transaction) => sum + transaction.amount, 0);
    return { name, charges, total };
  });
}
