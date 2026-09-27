import { PaymentsView } from "@/components/payments/payments-view";
import { getBudgetData } from "@/lib/data";

export default async function PaymentsPage() {
  const { profile, categories, paymentMethods, transactions } = await getBudgetData();

  return (
    <PaymentsView
      categories={categories}
      paymentMethods={paymentMethods}
      transactions={transactions}
      currency={profile?.currency_symbol || "$"}
      generatedAt={new Date().toISOString()}
    />
  );
}
