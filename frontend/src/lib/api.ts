import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";
import type { Dataset } from "./api.types"; // will create this file shortly

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:5050";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json"
  }
});

export type SeverityLevel = "critical" | "high" | "medium" | "low" | "unknown";

export type MetricSummary = {
  summary: {
    criticalHosts: number;
    riskyConnections: number;
    impactedBusiness: number;
    totalAlerts: number;
  };
  recent: {
    edr: number;
    ndr: number;
  };
};

export type TimelineEvent = {
  dataset: "EDR" | "NDR";
  timestamp: string;
  host?: string;
  business_process?: string;
  source_ip?: string;
  destination_ip?: string;
  transport?: string;
  action?: string;
  rule?: string;
  severity: SeverityLevel;
  process_name?: string;
  process_command?: string;
  tags: string[];
};

export type FlowRecord = {
  "@timestamp": string;
  source: {
    ip: string;
    host?: string;
    business_process?: string;
    locality?: string;
  };
  destination: {
    ip: string;
    port?: number;
    country?: string;
    locality?: string;
    geo?: {
      lat: number;
      lon: number;
    };
  };
  network: {
    protocol?: string;
    direction?: "inbound" | "outbound" | "internal";
    bytes?: number;
    packets?: number;
    tls?: {
      certificate?: {
        self_signed?: boolean;
        issuer?: string;
      };
      ja3?: string;
    };
  };
  event: {
    action?: string;
  };
  tags?: string[];
};

type PaginatedResponse<T> = {
  items: T[];
  total: number;
};

export function useMetricsQuery() {
  return useQuery<MetricSummary>({
    queryKey: ["metrics"],
    queryFn: async () => {
      const response = await api.get<MetricSummary>("/api/v1/metrics");
      return response.data;
    },
    refetchInterval: 60_000
  });
}

export function useTimelineQuery(params: { businessProcess?: string; severity?: string; dataset?: Dataset | "all" }) {
  const queryKey = useMemo(() => ["timeline", params], [params]);
  return useQuery<PaginatedResponse<TimelineEvent>>({
    queryKey,
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<TimelineEvent>>("/api/v1/timeline");
      return response.data;
    },
    select: (data) => ({
      items: data.items.filter((item) => {
        const businessMatch =
          params.businessProcess && params.businessProcess !== "all"
            ? (item.business_process ?? "").toLowerCase() === params.businessProcess.toLowerCase()
            : true;

        const severityMatch =
          params.severity && params.severity !== "all"
            ? (item.severity ?? "").toLowerCase() === params.severity.toLowerCase()
            : true;

        const datasetMatch =
          params.dataset && params.dataset !== "all"
            ? item.dataset.toLowerCase() === params.dataset.toLowerCase()
            : true;

        return businessMatch && severityMatch && datasetMatch;
      }),
      total: data.total
    }),
    refetchInterval: 30_000
  });
}

export function useFlowsQuery(params: { direction?: FlowRecord["network"]["direction"]; businessProcess?: string }) {
  const queryKey = useMemo(() => ["flows", params], [params]);
  return useQuery<PaginatedResponse<FlowRecord>>({
    queryKey,
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<FlowRecord>>("/api/v1/flows", {
        params: {
          direction: params.direction,
          businessProcess: params.businessProcess
        }
      });
      return response.data;
    },
    refetchInterval: 45_000
  });
}

export function formatDate(value: string | null | undefined, format = "YYYY-MM-DD HH:mm:ss") {
  if (!value) return "n/a";
  return dayjs(value).format(format);
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[unitIndex]}`;
}

export function hashIpToCoords(ip: string): [number, number] {
  const segments = ip.split(".").map((segment) => Number.parseInt(segment, 10) || 0);
  const hash = segments.reduce((acc, curr) => acc * 31 + curr, 7);
  const lat = ((hash % 180) + 180) % 180 - 90;
  const lon = ((hash % 360) + 360) % 360 - 180;
  return [lon, lat];
}
