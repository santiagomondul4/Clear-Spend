export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-48 animate-pulse rounded-xl bg-white/5" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}
