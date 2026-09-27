"use server";

import { revalidatePath } from "next/cache";
import { getClaimsUser } from "@/lib/data";
import { isCardKind } from "@/lib/payments";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, PaymentMethod } from "@/lib/types";

function refreshBudgetViews() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/budgets");
}

async function rememberCard(kind: "credit" | "debit", name: string) {
  const user = await getClaimsUser();
  if (!user) return { error: "You need to sign in again." } satisfies ActionResult;

  const supabase = await createClient();
  const { data: existing, error: lookupError } = await supabase
    .from("payment_methods")
    .select("id, user_id, kind, name")
    .eq("kind", kind)
    .eq("name", name)
    .maybeSingle();

  if (lookupError) return { error: lookupError.message };
  if (existing && (existing.kind === "credit" || existing.kind === "debit")) {
    const method: PaymentMethod = {
      id: existing.id,
      user_id: existing.user_id,
      kind: existing.kind,
      name: existing.name,
    };
    return { method };
  }

  const { data, error } = await supabase
    .from("payment_methods")
    .insert({ user_id: user.id, kind, name })
    .select("id, user_id, kind, name")
    .single();

  if (error) return { error: error.message };
  if (data.kind !== "credit" && data.kind !== "debit") {
    return { error: "Choose credit or debit for a saved card." };
  }

  const method: PaymentMethod = {
    id: data.id,
    user_id: data.user_id,
    kind: data.kind,
    name: data.name,
  };
  return { method };
}

export async function savePaymentMethod(
  kind: string,
  name: string,
): Promise<ActionResult & { method?: PaymentMethod }> {
  const trimmed = name.trim();
  if (!isCardKind(kind)) return { error: "Save a name for a credit or debit card." };
  if (!trimmed) return { error: "Name this card before saving it." };

  const result = await rememberCard(kind, trimmed);
  if (result.error || !result.method) return { error: result.error ?? "Could not save that card." };

  refreshBudgetViews();
  return { message: "Saved", method: result.method };
}

export async function saveTransaction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getClaimsUser();
  if (!user) return { error: "You need to sign in again." };

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const categoryId = String(formData.get("category_id") ?? "");
  const paymentKind = String(formData.get("payment_kind") ?? "");
  const cardName = String(formData.get("card_name") ?? "").trim();
  const transactionDate = String(formData.get("transaction_date") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const parsedDate = new Date(transactionDate);

  if (!title) return { error: "Add a title or merchant." };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Amount must be greater than zero." };
  }
  if (!categoryId) return { error: "Choose a category." };
  if (paymentKind !== "credit" && paymentKind !== "debit" && paymentKind !== "cash") {
    return { error: "Choose credit, debit, or cash." };
  }
  if (paymentKind !== "cash" && !cardName) return { error: "Name this card." };
  if (Number.isNaN(parsedDate.getTime())) return { error: "Choose a valid date and time." };

  const payload = {
    user_id: user.id,
    title,
    amount,
    category_id: categoryId,
    payment_kind: paymentKind,
    card_name: paymentKind === "cash" ? null : cardName,
    transaction_date: parsedDate.toISOString(),
    notes: notes || null,
  };

  const supabase = await createClient();
  const query = id
    ? supabase.from("transactions").update(payload).eq("id", id)
    : supabase.from("transactions").insert(payload);
  const { error } = await query;

  if (error) return { error: error.message };

  if (isCardKind(paymentKind)) {
    const saved = await rememberCard(paymentKind, cardName);
    if (saved.error) return { error: saved.error };
  }

  refreshBudgetViews();
  return { message: "Saved" };
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const user = await getClaimsUser();
  if (!user) return { error: "You need to sign in again." };

  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return { error: error.message };

  refreshBudgetViews();
  return { message: "Deleted" };
}
