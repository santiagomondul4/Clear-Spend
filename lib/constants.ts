import type { Category } from "@/lib/types";

export const CATEGORY_ORDER = [
  "Food & Dining",
  "Bills & Utilities",
  "Groceries",
  "Shopping",
  "Entertainment",
  "Transportation",
  "Health",
  "Misc",
] as const;

export const PAYMENT_KINDS = [
  { id: "credit", label: "Credit" },
  { id: "debit", label: "Debit" },
  { id: "cash", label: "Cash" },
] as const;

export const PERIODS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
] as const;

export function sortCategories(categories: Category[]) {
  return [...categories].sort((a, b) => {
    const aIndex = CATEGORY_ORDER.indexOf(a.name as (typeof CATEGORY_ORDER)[number]);
    const bIndex = CATEGORY_ORDER.indexOf(b.name as (typeof CATEGORY_ORDER)[number]);
    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
  });
}
