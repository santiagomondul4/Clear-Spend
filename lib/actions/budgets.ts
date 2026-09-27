"use server";

import { revalidatePath } from "next/cache";
import { getClaimsUser } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

export async function updateBudgets(formData: FormData): Promise<ActionResult> {
  const user = await getClaimsUser();
  if (!user) return { error: "You need to sign in again." };

  const updates: { id: string; budget_limit: number }[] = [];

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("budget:") || typeof value !== "string") continue;
    const budgetLimit = Number(value);
    if (!Number.isFinite(budgetLimit) || budgetLimit < 0) {
      return { error: "Each monthly budget must be zero or more." };
    }
    updates.push({ id: key.slice("budget:".length), budget_limit: budgetLimit });
  }

  if (updates.length === 0) return { error: "No budgets to save." };

  const supabase = await createClient();
  const results = await Promise.all(
    updates.map((update) =>
      supabase.from("categories").update({ budget_limit: update.budget_limit }).eq("id", update.id),
    ),
  );

  const failure = results.find((result) => result.error);
  if (failure?.error) return { error: failure.error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/budgets");
  revalidatePath("/dashboard/transactions");
  return { message: "Budgets saved." };
}
