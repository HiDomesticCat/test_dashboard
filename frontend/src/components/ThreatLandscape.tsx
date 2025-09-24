import { useMemo } from "react";
import { Globe2, Flame, Route, MapPinned } from "lucide-react";
import ReactECharts from "echarts-for-react";
import { useTimelineQuery, formatBytes, hashIpToCoords } from "../lib/api";
import type { Dataset, TimelineEvent } from "../lib/api";
import { useInvestigationFilters } from "../hooks/useInvestigationFilters";
import { SkeletonCard } from "./SkeletonCard";

export function ThreatLandscape() {
  const { filters } = useInvestigationFilters();
  const { data, isLoading } = useTimelineQuery({
    businessProcess: filters.businessProcess,
    severity: filters.severity,
    dataset: filters.dataset
  });

  const geoSeries = useMemo(() => buildGeoSeries(data?.items ?? []), [data?.items]);
  const topBusiness = useMemo(() => buildBusinessChart(data?.items ?? []), [data?.items]);
  const topRules = useMemo(() => buildRuleChart(data?.items ?? []), [data?.items]);

  if (isLoading || !data) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <SkeletonCard />
        <div className="grid gap-6 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <section aria-labelledby="threat-landscape-heading" className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-brand.secondary/70">威脅樣貌與攻擊面</p>
          <h3 id="threat-landscape-heading" className="mt-1 text-xl font-semibold text-slate-100">
            觀察攻擊來源、目標與策略
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Flame className="h-3 w-3 text-brand.danger" /> 熱點
          </span>
          <span className="flex items-center gap-1">
            <Route className="h-3 w-3 text-brand.primary" /> 攻擊路徑
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <article className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">全球威脅拓撲</p>
              <p className="text-sm text-slate-400">NDR 流量來源與目的地熱點</p>
            </div>
            <Globe2 className="h-6 w-6 text-brand.primary" />
          </header>
          <ReactECharts option={geoSeries} style={{ height: 360 }} theme="dark" />
        </article>

        <div className="grid gap-6 sm:grid-cols-2">
          <article className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <header className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Top 受攻擊業務流程</p>
                <p className="text-xs text-slate-500">EDR + NDR 統計</p>
              </div>
              <MapPinned className="h-5 w-5 text-brand.primary" />
            </header>
            <ReactECharts option={topBusiness} style={{ height: 220 }} theme="dark" />
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <header className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Top 攻擊手法 / 規則</p>
                <p className="text-xs text-slate-500">EDR 告警排名</p>
              </div>
              <Flame className="h-5 w-5 text-brand.secondary" />
            </header>
            <ReactECharts option={topRules} style={{ height: 220 }} theme="dark" />
          </article>
        </div>
      </div>
    </section>
  );
}

function buildGeoSeries(events: TimelineEvent[]) {
  const flows = events.filter((event) => event.dataset === "NDR").slice(0, 80);

  const scatterData = flows
    .filter((event) => event.source_ip && event.destination_ip)
    .map((event) => {
      const coords = hashIpToCoords(event.destination_ip as string);
      return {
        name: event.destination_ip,
        value: [...coords, event.tags.includes("exfil") ? 100 : 40],
        business: event.business_process,
        severity: event.severity
      };
    });

  const lineData = flows
    .filter((event) => event.source_ip && event.destination_ip)
    .map((event) => ({
      coords: [hashIpToCoords(event.source_ip as string), hashIpToCoords(event.destination_ip as string)],
      value: event.tags.includes("exfil") ? 1 : 0
    }));

  return {
    backgroundColor: "transparent",
    geo: {
      map: "world",
      roam: true,
      itemStyle: {
        areaColor: "#0f172a",
        borderColor: "#1e293b"
      },
      emphasis: {
        itemStyle: {
          areaColor: "#1e293b"
        }
      }
    },
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "#38bdf8",
      textStyle: {
        color: "#e2e8f0"
      },
      formatter: (params: any) => {
        if (params.seriesType === "scatter") {
          return `
            <strong>${params.data.name}</strong><br/>
            業務流程：${params.data.business ?? "未標記"}<br/>
            嚴重度：${params.data.severity}
          `;
        }
        return "攻擊路徑";
      }
    },
    series: [
      {
        name: "攻擊路徑",
        type: "lines",
        coordinateSystem: "geo",
        data: lineData,
        effect: {
          show: true,
          symbol: "arrow",
          symbolSize: 6,
          color: "#38bdf8"
        },
        lineStyle: {
          width: 1,
          opacity: 0.4,
          color: "#38bdf8"
        }
      },
      {
        name: "熱點",
        type: "scatter",
        coordinateSystem: "geo",
        data: scatterData,
        symbolSize: (value: number[]) => Math.max(6, Math.sqrt(value[2] * 5)),
        itemStyle: {
          color: "#f472b6"
        }
      }
    ]
  };
}

function buildBusinessChart(events: TimelineEvent[]) {
  const group = events.reduce<Record<string, number>>((acc, event) => {
    const key = event.business_process ?? "未分類業務";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const sorted = Object.entries(group)
    .map(([business, count]) => ({ business, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    backgroundColor: "transparent",
    tooltip: { trigger: "axis" },
    grid: { left: 60, right: 16, top: 20, bottom: 10 },
    xAxis: {
      type: "value",
      axisLabel: { color: "#cbd5f5" },
      axisLine: { lineStyle: { color: "#334155" } }
    },
    yAxis: {
      type: "category",
      data: sorted.map((item) => item.business),
      axisLabel: { color: "#cbd5f5" },
      axisLine: { lineStyle: { color: "#334155" } }
    },
    series: [
      {
        type: "bar",
        data: sorted.map((item) => item.count),
        itemStyle: {
          color: new Proxy(
            { __brand: "gradient" },
            {
              get: () => ({
                type: "linear",
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  { offset: 0, color: "#38bdf8" },
                  { offset: 1, color: "#f472b6" }
                ]
              })
            }
          )
        },
        barWidth: "55%"
      }
    ]
  };
}

function buildRuleChart(events: TimelineEvent[]) {
  const edrEvents = events.filter((event) => event.dataset === "EDR");

  const group = edrEvents.reduce<Record<string, number>>((acc, event) => {
    const key = event.rule ?? "未命名規則";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const sorted = Object.entries(group)
    .map(([rule, count]) => ({ rule, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    backgroundColor: "transparent",
    tooltip: { trigger: "axis" },
    grid: { left: 40, right: 16, top: 30, bottom: 50 },
    xAxis: {
      type: "category",
      data: sorted.map((item) => item.rule),
      axisLabel: { color: "#cbd5f5", rotate: 25 },
      axisLine: { lineStyle: { color: "#334155" } }
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#cbd5f5" },
      axisLine: { lineStyle: { color: "#334155" } }
    },
    series: [
      {
        type: "line",
        smooth: true,
        symbol: "circle",
        data: sorted.map((item) => item.count),
        lineStyle: { width: 2, color: "#38bdf8" },
        itemStyle: { color: "#f472b6" },
        areaStyle: {
          color: new Proxy(
            { __brand: "gradient" },
            {
              get: () => ({
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: "rgba(56, 189, 248, 0.35)" },
                  { offset: 1, color: "rgba(15, 23, 42, 0)" }
                ]
              })
            }
          )
        }
      }
    ]
  };
}
