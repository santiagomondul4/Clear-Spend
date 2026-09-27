"use server";

import { revalidatePath } from "next/cache";
import { getClaimsUser } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, Theme } from "@/lib/types";

export async function updateTheme(theme: Theme): Promise<ActionResult> {
  if (theme !== "dark" && theme !== "light") return { error: "Choose dark or light." };

  const user = await getClaimsUser();
  if (!user) return { error: "You need to sign in again." };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ theme }).eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { message: "Saved" };
}
