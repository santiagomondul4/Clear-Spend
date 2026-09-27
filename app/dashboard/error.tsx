"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6">
      <h1 className="text-lg font-semibold">Could not load your budget</h1>
      <p className="mt-2 text-sm text-rose-100">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-sm"
      >
        Try again
      </button>
    </div>
  );
}
