import { Bell, Search, Sparkles } from "lucide-react";
import { useInvestigationFilters } from "../hooks/useInvestigationFilters";
import { formatDate } from "../lib/api";

export function TopBar() {
  const { filters, setFilters } = useInvestigationFilters();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-6 py-4 backdrop-blur-md">
      <div>
        <p className="text-xs uppercase tracking-widest text-brand.primary/70">Project Sentinel Fusion</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-100">XDR 關聯調查儀表板</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden lg:flex lg:items-center lg:gap-6">
          <QuickScopeButton label="過去 1 小時" value="1h" active={filters.timeRange === "1h"} onClick={setFilters} />
          <QuickScopeButton label="過去 6 小時" value="6h" active={filters.timeRange === "6h"} onClick={setFilters} />
          <QuickScopeButton label="過去 24 小時" value="24h" active={filters.timeRange === "24h"} onClick={setFilters} />
          <QuickScopeButton label="過去 72 小時" value="72h" active={filters.timeRange === "72h"} onClick={setFilters} />
        </div>
        <div className="hidden items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-1 text-xs text-slate-400 lg:flex">
          <Sparkles className="h-3.5 w-3.5 text-brand.secondary" />
          <span>攻擊線索自動補齊</span>
        </div>
        <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 text-slate-300 transition hover:text-brand.primary">
          <Search className="h-4 w-4" />
        </button>
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 text-slate-300 transition hover:text-brand.primary">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand.danger" />
        </button>
      </div>
    </header>
  );
}

type QuickScopeButtonProps = {
  label: string;
  value: "1h" | "6h" | "12h" | "24h" | "72h";
  onClick: ReturnType<typeof useInvestigationFilters>["setFilters"];
  active: boolean;
};

function QuickScopeButton({ label, value, onClick, active }: QuickScopeButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onClick((prev) => ({ ...prev, timeRange: value }))}
      className={`rounded-lg border px-3 py-1 text-xs transition ${
        active
          ? "border-brand.primary bg-brand.primary/10 text-brand.primary"
          : "border-slate-800 bg-slate-900/30 text-slate-400 hover:border-brand.primary/50 hover:text-brand.primary"
      }`}
    >
      {label}
    </button>
  );
}
