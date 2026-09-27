"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, signUp } from "@/lib/actions/auth";
import { buttonClass, inputClass, panelClass } from "@/components/ui";
import type { ActionResult } from "@/lib/types";

export function AuthForm({
  mode,
  initialError,
}: {
  mode: "login" | "signup";
  initialError?: string;
}) {
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    action,
    initialError ? { error: initialError } : null,
  );

  return (
    <form action={formAction} className={`${panelClass} w-full max-w-md space-y-4 p-6`}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {mode === "login"
            ? "Sign in to review spending and budgets."
            : "We’ll set up your categories and starter monthly limits."}
        </p>
      </div>

      {mode === "signup" ? (
        <label className="block space-y-1.5 text-sm">
          <span className="text-slate-300">Full name</span>
          <input name="full_name" required autoComplete="name" className={inputClass} />
        </label>
      ) : null}

      <label className="block space-y-1.5 text-sm">
        <span className="text-slate-300">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
        />
      </label>

      <label className="block space-y-1.5 text-sm">
        <span className="text-slate-300">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className={inputClass}
        />
      </label>

      {state?.error ? (
        <p role="alert" className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {state.error}
        </p>
      ) : null}
      {state?.message ? (
        <p role="status" className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {state.message}
        </p>
      ) : null}

      <button type="submit" className={`${buttonClass} w-full`} disabled={pending}>
        {pending ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
      </button>

      <p className="text-center text-sm text-slate-400">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/signup" className="text-indigo-300 hover:text-indigo-200">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-300 hover:text-indigo-200">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
