import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { useFlowsQuery, formatBytes } from "../lib/api";
import type { FlowRecord } from "../lib/api";
import { useInvestigationFilters } from "../hooks/useInvestigationFilters";
import { SkeletonCard } from "./SkeletonCard";

export function LateralMovement() {
  const { filters } = useInvestigationFilters();
  const { data, isLoading } = useFlowsQuery({
    direction: "internal",
    businessProcess: filters.businessProcess === "all" ? undefined : filters.businessProcess
  });

  const heatmapOption = useMemo(() => buildHeatmap(data?.items ?? []), [data?.items]);
  const spikeOption = useMemo(() => buildOutboundSpike(data?.items ?? []), [data?.items]);

  if (isLoading || !data) {
    return (
      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <SkeletonCard />
        <SkeletonCard />
      </section>
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <article className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <header className="mb-4">
          <p className="text-xs uppercase tracking-widest text-brand.primary/70">橫向移動熱力圖</p>
          <h4 className="text-lg font-semibold text-slate-100">業務系統間存取矩陣</h4>
          <p className="text-xs text-slate-500">來源 vs. 目的業務流程，顏色代表連線密度</p>
        </header>
        <ReactECharts option={heatmapOption} style={{ height: 320 }} theme="dark" />
      </article>

      <article className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <header className="mb-4">
          <p className="text-xs uppercase tracking-widest text-brand.secondary/70">資料外洩監控</p>
          <h4 className="text-lg font-semibold text-slate-100">Outbound Bytes Top 5</h4>
          <p className="text-xs text-slate-500">偵測異常大流量對外傳送</p>
        </header>
        <ReactECharts option={spikeOption} style={{ height: 320 }} theme="dark" />
      </article>
    </section>
  );
}

function buildHeatmap(flows: FlowRecord[]) {
  const matrix: Record<string, Record<string, number>> = {};
  flows.forEach((flow) => {
    const sourceBiz = flow.source.business_process ?? "未分類";
    const destBiz = flow.destination.business_process ?? "未分類";
    matrix[sourceBiz] ??= {};
    matrix[sourceBiz][destBiz] = (matrix[sourceBiz][destBiz] ?? 0) + 1;
  });

  const sourceKeys = Object.keys(matrix);
  const destKeys = Array.from(new Set(Object.values(matrix).flatMap((rows) => Object.keys(rows))));

  const data: [number, number, number][] = [];
  sourceKeys.forEach((src, i) => {
    destKeys.forEach((dst, j) => {
      data.push([j, i, matrix[src]?.[dst] ?? 0]);
    });
  });

  return {
    tooltip: {
      formatter: (params: any) => {
        const [x, y, value] = params.data;
        return `
          <strong>${sourceKeys[y]}</strong> ➜ <strong>${destKeys[x]}</strong><br/>
          連線次數：${value}
        `;
      }
    },
    grid: { top: 30, bottom: 40, left: 100 },
    xAxis: {
      type: "category",
      data: destKeys,
      axisLabel: { rotate: 30, color: "#94a3b8" }
    },
    yAxis: {
      type: "category",
      data: sourceKeys,
      axisLabel: { color: "#94a3b8" }
    },
    visualMap: {
      min: 0,
      max: Math.max(...data.map((item) => item[2]), 1),
      calculable: true,
      orient: "horizontal",
      left: "center",
      bottom: 0,
      textStyle: { color: "#e2e8f0" }
    },
    series: [
      {
        type: "heatmap",
        data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.5)"
          }
        },
        label: { show: true, color: "#e2e8f0" }
      }
    ]
  };
}

function buildOutboundSpike(flows: FlowRecord[]) {
  const outboundMap: Record<string, number> = {};
  flows.forEach((flow) => {
    const ip = flow.destination.ip ?? "unknown";
    outboundMap[ip] = (outboundMap[ip] ?? 0) + (flow.network.bytes ?? 0);
  });

  const top = Object.entries(outboundMap)
    .map(([ip, bytes]) => ({ ip, bytes }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 5);

  return {
    grid: { left: 60, right: 20, top: 20, bottom: 40 },
    xAxis: {
      type: "category",
      data: top.map((item) => item.ip),
      axisLabel: { color: "#94a3b8", rotate: 20 }
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "#94a3b8",
        formatter: (value: number) => formatBytes(value)
      }
    },
    tooltip: {
      trigger: "axis",
      formatter: (params: any[]) => {
        const [point] = params;
        return `
          <strong>${point.axisValue}</strong><br/>
          Bytes：${formatBytes(point.data)}
        `;
      }
    },
    series: [
      {
        type: "bar",
        data: top.map((item) => item.bytes),
        itemStyle: {
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
                  { offset: 0, color: "#38bdf8" },
                  { offset: 1, color: "#0f172a" }
                ]
              })
            }
          )
        }
      }
    ]
  };
}
