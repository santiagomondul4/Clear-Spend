import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getBudgetData } from "@/lib/data";

export default async function DashboardPage() {
  const { profile, categories, paymentMethods, transactions } = await getBudgetData();

  return (
    <DashboardView
      categories={categories}
      paymentMethods={paymentMethods}
      transactions={transactions}
      currency={profile?.currency_symbol || "$"}
      generatedAt={new Date().toISOString()}
    />
  );
}
