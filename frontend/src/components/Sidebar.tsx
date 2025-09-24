import { useMemo } from "react";
import { Menu, ShieldCheck, Activity, Database, Filter } from "lucide-react";
import { useInvestigationFilters } from "../hooks/useInvestigationFilters";

const NAV_ITEMS = [
  { id: "overview", label: "安全總覽", icon: ShieldCheck },
  { id: "landscape", label: "威脅樣貌", icon: Activity },
  { id: "movement", label: "橫向移動", icon: Database },
  { id: "timeline", label: "事件時間軸", icon: Filter }
];

const BUSINESS_OPTIONS = [
  { value: "all", label: "全部業務流程" },
  { value: "Core Payment Service", label: "核心金流服務" },
  { value: "Digital Banking Portal", label: "數位銀行入口" },
  { value: "ERP Finance", label: "ERP 會計系統" },
  { value: "Remote Workforce Access", label: "遠端工作入口" },
  { value: "AI Research Platform", label: "AI 研究環境" }
];

const SEVERITY_OPTIONS = [
  { value: "all", label: "全部嚴重度" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" }
];

const DATASET_OPTIONS = [
  { value: "all", label: "EDR + NDR" },
  { value: "edr", label: "EDR 告警" },
  { value: "ndr", label: "NDR 事件" }
];

export function Sidebar() {
  const { filters, setFilters } = useInvestigationFilters();

  const activeNav = useMemo(() => {
    if (filters.dataset === "edr") return "overview";
    if (filters.dataset === "ndr") return "landscape";
    return "timeline";
  }, [filters.dataset]);

  return (
    <aside className="hidden min-h-screen border-r border-slate-800 bg-slate-950/80 backdrop-blur-md lg:flex lg:w-72 lg:flex-col">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand.primary/10 text-brand.primary">
          <Menu className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">Sentinel Fusion</p>
          <h1 className="text-lg font-semibold text-slate-100">XDR 關聯分析</h1>
        </div>
      </div>

      <nav className="flex flex-col gap-2 px-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeNav;
          return (
            <button
              key={item.id}
              type="button"
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition-colors ${
                isActive ? "bg-brand.primary/15 text-brand.primary" : "text-slate-300 hover:bg-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-8 flex flex-1 flex-col gap-6 px-6 pb-8">
        <FilterCard
          title="業務流程"
          options={BUSINESS_OPTIONS}
          value={filters.businessProcess}
          onChange={(value) => setFilters((prev) => ({ ...prev, businessProcess: value }))}
        />
        <FilterCard
          title="嚴重度"
          options={SEVERITY_OPTIONS}
          value={filters.severity}
          onChange={(value) => setFilters((prev) => ({ ...prev, severity: value }))}
        />
        <FilterCard
          title="資料來源"
          options={DATASET_OPTIONS}
          value={filters.dataset}
          onChange={(value) => setFilters((prev) => ({ ...prev, dataset: value as typeof prev.dataset }))}
        />
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <h3 className="text-sm font-semibold text-slate-200">調查提示</h3>
          <ul className="mt-3 space-y-2 text-xs text-slate-400">
            <li>• 由業務流程切入，聚焦核心資產。</li>
            <li>• 關聯 EDR / NDR 事件，確認橫向移動。</li>
            <li>• 利用時間軸重建攻擊鏈。</li>
          </ul>
        </div>
      </div>
    </aside>
  );
}

type FilterProps = {
  title: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
};

function FilterCard({ title, value, options, onChange }: FilterProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      <select
        className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-brand.primary focus:ring-2 focus:ring-brand.primary/20"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-slate-950 text-slate-100">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
