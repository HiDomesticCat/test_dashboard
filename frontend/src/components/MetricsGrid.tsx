import { TrendingUp, ShieldAlert, RadioTower, Building2 } from "lucide-react";
import { useMetricsQuery } from "../lib/api";
import { SkeletonCard } from "./SkeletonCard";

const metricCards = [
  {
    id: "criticalHosts",
    label: "EDR 嚴重告警主機",
    icon: ShieldAlert,
    description: "rule.level = critical 的主機數",
    accent: "from-rose-500/20 via-rose-500/10 to-transparent",
    numberClass: "text-rose-300"
  },
  {
    id: "riskyConnections",
    label: "NDR 高風險連線",
    icon: RadioTower,
    description: "TLS 自簽 / DNS 可疑 TLD",
    accent: "from-amber-500/20 via-amber-500/10 to-transparent",
    numberClass: "text-amber-300"
  },
  {
    id: "impactedBusiness",
    label: "受影響業務流程",
    icon: Building2,
    description: "高風險 / 嚴重告警的業務流程",
    accent: "from-blue-500/20 via-blue-500/10 to-transparent",
    numberClass: "text-blue-300"
  },
  {
    id: "totalAlerts",
    label: "告警 / 事件總數 (24h)",
    icon: TrendingUp,
    description: "EDR + NDR 全部事件數",
    accent: "from-emerald-500/20 via-emerald-500/10 to-transparent",
    numberClass: "text-emerald-300"
  }
] as const;

export function MetricsGrid() {
  const { data, isLoading } = useMetricsQuery();

  if (isLoading || !data) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <SkeletonCard key={card.id} />
        ))}
      </div>
    );
  }

  return (
    <section aria-labelledby="metrics-heading">
      <h3 id="metrics-heading" className="sr-only">
        安全指標總覽
      </h3>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          const value = data.summary[card.id as keyof typeof data.summary];

          return (
            <article
              key={card.id}
              className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-card transition hover:border-brand.primary/40 hover:shadow-xl"
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.accent}`} />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400">{card.label}</p>
                  <p className={`mt-3 text-4xl font-semibold ${card.numberClass}`}>{value.toLocaleString()}</p>
                  <p className="mt-2 text-xs text-slate-400">{card.description}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/60 text-slate-300">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
