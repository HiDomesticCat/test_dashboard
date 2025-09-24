import fs from "node:fs/promises";
import path from "node:path";
import dayjs from "dayjs";
import sortBy from "lodash/sortBy.js";
import { deriveNetworkSeverity } from "./data-service.js";

const TICK_INTERVAL_MS = 4000;

export async function registerPlaybackLoop(io, dataDir) {
  const cache = {
    snapshots: [],
    cursor: 0
  };

  await warmupSnapshots(cache, dataDir);
  setInterval(() => broadcastNext(io, cache), TICK_INTERVAL_MS);
}

async function warmupSnapshots(cache, dataDir) {
  const [edrRaw, ndrRaw] = await Promise.all([
    fs.readFile(path.join(dataDir, "edr_alerts.json"), "utf-8"),
    fs.readFile(path.join(dataDir, "ndr_flows.json"), "utf-8")
  ]);
  const edr = JSON.parse(edrRaw);
  const ndr = JSON.parse(ndrRaw);

  cache.snapshots = buildSnapshots(edr, ndr);
  cache.cursor = 0;
}

function broadcastNext(io, cache) {
  if (!cache.snapshots.length) return;
  const snapshot = cache.snapshots[cache.cursor];
  io.emit("xdr_snapshot", snapshot);
  cache.cursor = (cache.cursor + 1) % cache.snapshots.length;
}

function buildSnapshots(edrEvents, ndrFlows) {
  const combined = [
    ...edrEvents.map((event) => ({
      dataset: "edr",
      timestamp: event["@timestamp"],
      host: event.host?.name,
      business_process: event.host?.business_process,
      detail: {
        rule: event.rule?.name,
        severity: event.rule?.level,
        process: event.process?.name,
        command: event.process?.command_line
      }
    })),
    ...ndrFlows.map((flow) => ({
      dataset: "ndr",
      timestamp: flow["@timestamp"],
      host: flow.source?.host,
      business_process: flow.source?.business_process ?? flow.destination?.business_process,
      detail: {
        action: flow.event?.action,
        severity: deriveNetworkSeverity(flow),
        destination: flow.destination?.ip,
        bytes: flow.network?.bytes
      }
    }))
  ];

  return sortBy(combined, (item) => dayjs(item.timestamp).valueOf());
}
