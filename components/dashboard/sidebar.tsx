"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, LayoutDashboard, LogOut, Moon, PiggyBank, ReceiptText, Sun, Wallet } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { useTheme } from "@/components/theme/theme-provider";

const LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/dashboard/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
];

export function Sidebar({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();
  const { theme, setTheme, pending } = useTheme();

  return (
    <div className="border-b border-white/10 bg-slate-950/40 md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col md:border-r md:border-b-0">
      <div className="flex items-center justify-between px-4 py-4 md:px-5">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
            <Wallet className="h-4 w-4" />
          </span>
          ClearSpend
        </Link>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeSwitch theme={theme} pending={pending} onChange={setTheme} />
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-xl border border-white/10 p-2 text-slate-300"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
      <nav className="flex gap-2 overflow-x-auto px-4 pb-4 md:flex-1 md:flex-col md:px-3">
        {LINKS.map((link) => {
          const active =
            link.href === "/dashboard" ? pathname === link.href : pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm whitespace-nowrap transition ${
                active
                  ? "bg-indigo-500/20 text-indigo-100"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="hidden border-t border-white/10 p-4 md:block">
        <ThemeSwitch theme={theme} pending={pending} onChange={setTheme} />
        <p className="mt-4 truncate text-sm font-medium text-slate-100">{name}</p>
        <p className="truncate text-xs text-slate-500">{email}</p>
        <form action={signOut} className="mt-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-100"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

function ThemeSwitch({
  theme,
  pending,
  onChange,
}: {
  theme: "dark" | "light";
  pending: boolean;
  onChange: (theme: "dark" | "light") => void;
}) {
  return (
    <div className="flex rounded-xl border border-white/10 bg-slate-950/60 p-1" role="group" aria-label="Color theme">
      {(
        [
          { id: "dark", label: "Dark", icon: Moon },
          { id: "light", label: "Light", icon: Sun },
        ] as const
      ).map((option) => {
        const selected = theme === option.id;
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            disabled={pending}
            onClick={() => onChange(option.id)}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition ${
              selected ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-slate-100"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
