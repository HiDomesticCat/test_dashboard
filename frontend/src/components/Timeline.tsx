import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { useTimelineQuery, formatDate } from "../lib/api";
import { useInvestigationFilters } from "../hooks/useInvestigationFilters";
import { SkeletonCard } from "./SkeletonCard";

export function Timeline() {
  const { filters } = useInvestigationFilters();
  const { data, isLoading } = useTimelineQuery({
    businessProcess: filters.businessProcess === "all" ? undefined : filters.businessProcess,
    severity: filters.severity === "all" ? undefined : filters.severity,
    dataset: filters.dataset
  });

  const chartOption = useMemo(() => buildTimelineOption(data?.items ?? []), [data?.items]);

  if (isLoading || !data) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <SkeletonCard />
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-brand.primary/70">事件調查時間軸</p>
          <h4 className="text-lg font-semibold text-slate-100">EDR / NDR 統一事件序列</h4>
          <p className="text-xs text-slate-500">
            點擊事件節點可查看詳細資訊，使用左側篩選器同步聚焦業務流程與資料來源。
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ReactECharts option={chartOption} style={{ height: 320 }} theme="dark" />
        <div className="max-h-80 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/40 p-4 scrollbar-thin">
          <ul className="space-y-4 text-sm">
            {data.items.slice(0, 15).map((event, index) => (
              <li key={`${event.timestamp}-${index}`} className="border-b border-slate-800 pb-3 last:border-none last:pb-0">
                <p className="text-xs text-slate-400">{formatDate(event.timestamp)}</p>
                <p className="mt-1 text-slate-100">
                  {event.dataset} · {event.rule ?? "未命名規則"}
                </p>
                <p className="text-xs text-slate-400">
                  {event.host ?? "unknown"} ➜ {event.destination_ip ?? "unknown"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {event.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-brand.primary/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-brand.primary">
                      {tag}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function buildTimelineOption(events: Parameters<typeof formatDate>[0] extends never ? never : any[]) {
  const categories = ["EDR", "NDR"];
  const seriesData = events.map((event) => ({
    name: event.rule ?? event.action ?? "事件",
    value: [categories.indexOf(event.dataset), new Date(event.timestamp).getTime(), event.host ?? "unknown"],
    itemStyle: {
      color: event.dataset === "EDR" ? "#38bdf8" : "#f472b6"
    }
  }));

  return {
    tooltip: {
      formatter: (params: any) => {
        const event = events[params.dataIndex];
        return `
          <strong>${event.rule ?? "事件"}</strong><br/>
          時間：${formatDate(event.timestamp)}<br/>
          主機：${event.host ?? "unknown"}<br/>
          來源：${event.source_ip ?? "-"} ➜ 目的：${event.destination_ip ?? "-"}<br/>
          嚴重度：${event.severity}
        `;
      }
    },
    grid: { top: 40, left: 80, right: 20, bottom: 40 },
    xAxis: {
      type: "time",
      axisLabel: { color: "#94a3b8" },
      axisLine: { lineStyle: { color: "#334155" } }
    },
    yAxis: {
      type: "category",
      data: categories,
      axisLabel: { color: "#94a3b8" },
      axisLine: { lineStyle: { color: "#334155" } }
    },
    series: [
      {
        type: "scatter",
        symbolSize: 14,
        data: seriesData
      }
    ]
  };
}
