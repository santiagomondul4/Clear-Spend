import type { Category, Period, Transaction } from "@/lib/types";

export type ChartPoint = {
  label: string;
  spent: number;
  budget: number;
};

export type BudgetRow = {
  category: Category;
  spent: number;
  limit: number;
};

export type BudgetTone = "ok" | "warn" | "over" | "empty";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function daysInMonth(now: Date) {
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

export function getPeriodBounds(period: Period, now: Date) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();

  if (period === "daily") {
    return {
      start: new Date(year, month, date),
      end: new Date(year, month, date + 1),
    };
  }

  if (period === "weekly") {
    const start = new Date(year, month, date - now.getDay());
    return {
      start,
      end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7),
    };
  }

  if (period === "monthly") {
    return {
      start: new Date(year, month, 1),
      end: new Date(year, month + 1, 1),
    };
  }

  return {
    start: new Date(year, 0, 1),
    end: new Date(year + 1, 0, 1),
  };
}

export function scaleMonthlyBudget(monthly: number, period: Period, now: Date) {
  if (period === "daily") return monthly / daysInMonth(now);
  if (period === "weekly") return (monthly * 12) / 52;
  if (period === "yearly") return monthly * 12;
  return monthly;
}

export function transactionsInPeriod(transactions: Transaction[], start: Date, end: Date) {
  return transactions.filter((transaction) => {
    const time = new Date(transaction.transaction_date).getTime();
    return time >= start.getTime() && time < end.getTime();
  });
}

export function sumAmounts(transactions: Transaction[]) {
  return transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
}

function spentOnDay(transactions: Transaction[], day: Date) {
  return transactions.reduce((sum, transaction) => {
    const txDate = new Date(transaction.transaction_date);
    const sameDay =
      txDate.getFullYear() === day.getFullYear() &&
      txDate.getMonth() === day.getMonth() &&
      txDate.getDate() === day.getDate();
    return sameDay ? sum + transaction.amount : sum;
  }, 0);
}

export function buildChart(
  transactions: Transaction[],
  monthlyBudget: number,
  period: Period,
  now: Date,
): ChartPoint[] {
  const { start, end } = getPeriodBounds(period, now);
  const inPeriod = transactionsInPeriod(transactions, start, end);
  const periodBudget = scaleMonthlyBudget(monthlyBudget, period, now);

  if (period === "daily") {
    const bucketBudget = periodBudget / 24;
    return Array.from({ length: 24 }, (_, hour) => {
      const spent = inPeriod.reduce((sum, transaction) => {
        return new Date(transaction.transaction_date).getHours() === hour
          ? sum + transaction.amount
          : sum;
      }, 0);
      const label =
        hour === 0 ? "12a" : hour < 12 ? `${hour}a` : hour === 12 ? "12p" : `${hour - 12}p`;
      return { label, spent, budget: bucketBudget };
    });
  }

  if (period === "weekly") {
    const bucketBudget = periodBudget / 7;
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      return {
        label: WEEKDAY_LABELS[day.getDay()] ?? "",
        spent: spentOnDay(inPeriod, day),
        budget: bucketBudget,
      };
    });
  }

  if (period === "monthly") {
    const count = daysInMonth(now);
    const bucketBudget = periodBudget / count;
    return Array.from({ length: count }, (_, index) => {
      const day = new Date(now.getFullYear(), now.getMonth(), index + 1);
      return {
        label: String(index + 1),
        spent: spentOnDay(inPeriod, day),
        budget: bucketBudget,
      };
    });
  }

  return MONTH_LABELS.map((label, month) => ({
    label,
    spent: inPeriod.reduce((sum, transaction) => {
      return new Date(transaction.transaction_date).getMonth() === month
        ? sum + transaction.amount
        : sum;
    }, 0),
    budget: monthlyBudget,
  }));
}

export function categoryBreakdown(transactions: Transaction[], categories: Category[]) {
  return categories
    .map((category) => ({
      id: category.id,
      name: category.name,
      color: category.color_hex,
      value: transactions
        .filter((transaction) => transaction.category_id === category.id)
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    }))
    .filter((item) => item.value > 0);
}

export function topCategoryName(transactions: Transaction[], categories: Category[]) {
  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    totals.set(
      transaction.category_id,
      (totals.get(transaction.category_id) ?? 0) + transaction.amount,
    );
  }

  let bestId: string | null = null;
  let bestAmount = 0;
  for (const [id, amount] of totals) {
    if (amount > bestAmount) {
      bestAmount = amount;
      bestId = id;
    }
  }

  if (!bestId) return "None yet";
  return categories.find((category) => category.id === bestId)?.name ?? "None yet";
}

export function monthlyBudgetRows(
  categories: Category[],
  transactions: Transaction[],
  now: Date,
): BudgetRow[] {
  const { start, end } = getPeriodBounds("monthly", now);
  const monthTransactions = transactionsInPeriod(transactions, start, end);

  return categories.map((category) => ({
    category,
    limit: category.budget_limit,
    spent: monthTransactions
      .filter((transaction) => transaction.category_id === category.id)
      .reduce((sum, transaction) => sum + transaction.amount, 0),
  }));
}

export function budgetTone(spent: number, limit: number): BudgetTone {
  if (limit <= 0) return spent > 0 ? "over" : "empty";
  const ratio = spent / limit;
  if (ratio < 0.75) return "ok";
  if (ratio <= 0.95) return "warn";
  return "over";
}

export function spentPercent(spent: number, limit: number) {
  if (limit <= 0) return spent > 0 ? 100 : 0;
  return Math.round((spent / limit) * 100);
}
