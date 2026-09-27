import { BudgetEditor } from "@/components/budgets/budget-editor";
import { getBudgetData } from "@/lib/data";

export default async function BudgetsPage() {
  const { profile, categories, transactions } = await getBudgetData();

  return (
    <BudgetEditor
      categories={categories}
      transactions={transactions}
      currency={profile?.currency_symbol || "$"}
      generatedAt={new Date().toISOString()}
    />
  );
}
