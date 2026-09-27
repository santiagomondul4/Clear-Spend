export type Theme = "dark" | "light";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  currency_symbol: string;
  theme: Theme;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  budget_limit: number;
  icon_name: string;
  color_hex: string;
};

export type PaymentKind = "credit" | "debit" | "cash";

export type PaymentMethod = {
  id: string;
  user_id: string;
  kind: Exclude<PaymentKind, "cash">;
  name: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category_id: string;
  payment_kind: PaymentKind;
  card_name: string | null;
  payment_method: string;
  transaction_date: string;
  notes: string | null;
};

export type Period = "daily" | "weekly" | "monthly" | "yearly";

export type TransactionFilters = {
  q?: string;
  category?: string;
  method?: string;
  from?: string;
  to?: string;
};

export type ActionResult = {
  error?: string;
  message?: string;
};
