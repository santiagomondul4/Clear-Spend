import { TransactionsView } from "@/components/transactions/transactions-view";
import { getBudgetData } from "@/lib/data";
import { readFilters } from "@/lib/filters";

export default async function TransactionsPage({
  searchParams,
}: PageProps<"/dashboard/transactions">) {
  const params = await searchParams;
  const { profile, categories, paymentMethods, transactions } = await getBudgetData();

  return (
    <TransactionsView
      categories={categories}
      paymentMethods={paymentMethods}
      transactions={transactions}
      currency={profile?.currency_symbol || "$"}
      filters={readFilters(params)}
    />
  );
}
