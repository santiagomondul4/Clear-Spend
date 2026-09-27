import Link from "next/link";
import { redirect } from "next/navigation";
import { PieChart, ReceiptText, Wallet } from "lucide-react";
import { getClaimsUser } from "@/lib/data";
import { buttonClass, ghostButtonClass, panelClass } from "@/components/ui";

const FEATURES = [
  {
    title: "Fast card entry",
    copy: "Log amount, merchant, card, and category in one form.",
    icon: ReceiptText,
  },
  {
    title: "Monthly budgets",
    copy: "See green, yellow, and red progress as each category fills up.",
    icon: Wallet,
  },
  {
    title: "Timeframe charts",
    copy: "Switch between today, this week, this month, and this year.",
    icon: PieChart,
  },
];

export default async function HomePage() {
  const user = await getClaimsUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-indigo-300">ClearSpend</p>
      <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
        A calmer way to watch where the money goes.
      </h1>
      <p className="mt-4 max-w-xl text-lg text-slate-400">
        Record card expenses, set a monthly limit for each category, and compare spending with your budget.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/signup" className={buttonClass}>
          Create account
        </Link>
        <Link href="/login" className={ghostButtonClass}>
          Sign in
        </Link>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <article key={feature.title} className={`${panelClass} p-5`}>
              <Icon className="h-5 w-5 text-indigo-300" />
              <h2 className="mt-3 font-medium">{feature.title}</h2>
              <p className="mt-1 text-sm text-slate-400">{feature.copy}</p>
            </article>
          );
        })}
      </div>
    </main>
  );
}
