import { cache } from "react";
import { redirect } from "next/navigation";
import { sortCategories } from "@/lib/constants";
import { formatPaymentMethod } from "@/lib/payments";
import { createClient } from "@/lib/supabase/server";
import type { Category, PaymentKind, PaymentMethod, Profile, Theme, Transaction } from "@/lib/types";

export const getClaimsUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims || typeof data.claims.sub !== "string") return null;

  return {
    id: data.claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : "",
  };
});

export async function requireUser() {
  const user = await getClaimsUser();
  if (!user) redirect("/login");
  return user;
}

function asNumber(value: number | string | null) {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, currency_symbol, theme")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const theme: Theme = data.theme === "light" ? "light" : "dark";
  return { ...data, theme };
});

export const getBudgetData = cache(async () => {
  const supabase = await createClient();
  const [profile, categoryResult, paymentResult, transactionResult] = await Promise.all([
    getProfile(),
    supabase.from("categories").select("id, user_id, name, budget_limit, icon_name, color_hex"),
    supabase
      .from("payment_methods")
      .select("id, user_id, kind, name")
      .order("name", { ascending: true }),
    supabase
      .from("transactions")
      .select("id, user_id, title, amount, category_id, payment_kind, card_name, transaction_date, notes")
      .order("transaction_date", { ascending: false }),
  ]);

  if (categoryResult.error) throw new Error(categoryResult.error.message);
  if (paymentResult.error) throw new Error(paymentResult.error.message);
  if (transactionResult.error) throw new Error(transactionResult.error.message);

  const categories: Category[] = sortCategories(
    (categoryResult.data ?? []).map((row) => ({
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      budget_limit: asNumber(row.budget_limit),
      icon_name: row.icon_name,
      color_hex: row.color_hex,
    })),
  );

  const paymentMethods: PaymentMethod[] = (paymentResult.data ?? []).flatMap((row) => {
    if (row.kind !== "credit" && row.kind !== "debit") return [];
    return [
      {
        id: row.id,
        user_id: row.user_id,
        kind: row.kind,
        name: row.name,
      },
    ];
  });

  const transactions: Transaction[] = (transactionResult.data ?? []).map((row) => {
    const paymentKind = row.payment_kind as PaymentKind;
    return {
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      amount: asNumber(row.amount),
      category_id: row.category_id,
      payment_kind: paymentKind,
      card_name: row.card_name,
      payment_method: formatPaymentMethod(paymentKind, row.card_name),
      transaction_date: row.transaction_date,
      notes: row.notes,
    };
  });

  return {
    profile,
    categories,
    paymentMethods,
    transactions,
  };
});
