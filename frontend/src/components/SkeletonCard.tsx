export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-900/60 bg-slate-900/30 p-6 shadow-inner">
      <div className="flex flex-col gap-3">
        <div className="h-2.5 w-32 animate-pulse rounded-full bg-slate-800" />
        <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-800/80" />
        <div className="h-2 w-40 animate-pulse rounded-full bg-slate-800/70" />
      </div>
    </div>
  );
}
