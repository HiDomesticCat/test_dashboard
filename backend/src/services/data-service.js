import fs from "node:fs/promises";
import path from "node:path";
import dayjs from "dayjs";
import sortBy from "lodash/sortBy.js";
import groupBy from "lodash/groupBy.js";
import uniq from "lodash/uniq.js";
import sumBy from "lodash/sumBy.js";

export async function loadDatasets(dataDir) {
  const [edrRaw, ndrRaw] = await Promise.all([
    fs.readFile(path.join(dataDir, "edr_alerts.json"), "utf-8"),
    fs.readFile(path.join(dataDir, "ndr_flows.json"), "utf-8")
  ]);

  const edrEvents = JSON.parse(edrRaw);
  const ndrFlows = JSON.parse(ndrRaw);

  return { edrEvents, ndrFlows };
}

export function computeMetrics(edrEvents, ndrFlows) {
  const criticalHosts = uniq(
    edrEvents
      .filter((event) => (event.rule?.level ?? "").toLowerCase() === "critical")
      .map((event) => event.host?.name)
  ).length;

  const riskyConnections = ndrFlows.filter((flow) => {
    if ((flow.network?.protocol ?? "").toLowerCase() === "tls") {
      return Boolean(flow.network?.tls?.certificate?.self_signed);
    }
    if ((flow.network?.protocol ?? "").toLowerCase() === "dns") {
      const question = flow.network?.dns?.question ?? "";
      return [".ru", ".cn", ".top", ".xyz", ".tk"].some((tld) => question.endsWith(tld));
    }
    return false;
  }).length;

  const impactedBusiness = uniq(
    [
      ...edrEvents
        .filter((event) => ["critical", "high"].includes((event.rule?.level ?? "").toLowerCase()))
        .map((event) => event.host?.business_process),
      ...ndrFlows
        .filter((flow) => ["critical", "high"].includes(deriveNetworkSeverity(flow)))
        .map((flow) => flow.source?.business_process ?? flow.destination?.business_process)
    ].filter(Boolean)
  ).length;

  const totalAlerts = edrEvents.length + ndrFlows.length;

  const last24h = dayjs().subtract(24, "hour");
  const recentAlerts = edrEvents.filter((event) => dayjs(event["@timestamp"]).isAfter(last24h)).length;
  const recentFlows = ndrFlows.filter((flow) => dayjs(flow["@timestamp"]).isAfter(last24h)).length;

  return {
    summary: {
      criticalHosts,
      riskyConnections,
      impactedBusiness,
      totalAlerts
    },
    recent: {
      edr: recentAlerts,
      ndr: recentFlows
    }
  };
}

export function generateTimeline(edrEvents, ndrFlows) {
  const edrTimeline = edrEvents.map((event) => ({
    dataset: "EDR",
    timestamp: event["@timestamp"],
    host: event.host?.name,
    business_process: event.host?.business_process,
    source_ip: event.network?.source_ip ?? "-",
    destination_ip: event.network?.destination_ip ?? "-",
    transport: event.network?.transport ?? "n/a",
    action: event.event?.action ?? "unknown",
    rule: event.rule?.name ?? "unspecified",
    severity: event.rule?.level ?? "unknown",
    process_name: event.process?.name ?? "n/a",
    process_command: event.process?.command_line ?? "",
    tags: event.tags ?? []
  }));

  const ndrTimeline = ndrFlows.map((flow) => ({
    dataset: "NDR",
    timestamp: flow["@timestamp"],
    host: flow.source?.host ?? "unknown",
    business_process: flow.source?.business_process ?? flow.destination?.business_process,
    source_ip: flow.source?.ip ?? "-",
    destination_ip: flow.destination?.ip ?? "-",
    transport: flow.network?.protocol ?? "n/a",
    action: flow.event?.action ?? "network_event",
    rule: flow.event?.action ?? "network_event",
    severity: deriveNetworkSeverity(flow),
    process_name: "-",
    process_command: "",
    tags: flow.tags ?? []
  }));

  return sortBy([...edrTimeline, ...ndrTimeline], (item) => -dayjs(item.timestamp).valueOf());
}

export function computeBusinessBreakdown(edrEvents, ndrFlows) {
  const edrGroup = groupBy(edrEvents, (event) => event.host?.business_process ?? "未分類");
  const ndrGroup = groupBy(ndrFlows, (flow) => flow.source?.business_process ?? flow.destination?.business_process ?? "未分類");

  const businesses = uniq([...Object.keys(edrGroup), ...Object.keys(ndrGroup)]);

  return businesses.map((biz) => ({
    business: biz,
    edrCount: (edrGroup[biz] ?? []).length,
    ndrCount: (ndrGroup[biz] ?? []).length,
    latestAlert: sortBy(edrGroup[biz] ?? [], (event) => -dayjs(event["@timestamp"]).valueOf())[0]?.["@timestamp"] ?? null
  }));
}

export function computeOutboundSpike(ndrFlows) {
  const outbound = ndrFlows.filter((flow) => (flow.network?.direction ?? "").toLowerCase() === "outbound");
  const grouped = groupBy(outbound, (flow) => flow.destination?.ip ?? "unknown");

  return Object.entries(grouped)
    .map(([ip, flows]) => ({
      ip,
      bytes: sumBy(flows, (flow) => flow.network?.bytes ?? 0),
      sessions: flows.length,
      latest: sortBy(flows, (flow) => -dayjs(flow["@timestamp"]).valueOf())[0]?.["@timestamp"] ?? null
    }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 10);
}

export function deriveNetworkSeverity(flow) {
  if (flow.tags?.includes("exfil") || flow.tags?.includes("c2")) return "critical";
  if (flow.tags?.includes("bruteforce") || flow.tags?.includes("credential_access")) return "high";
  if (flow.tags?.includes("internal_reconnaissance")) return "medium";
  return "low";
}
