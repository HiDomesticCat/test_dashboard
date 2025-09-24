import express from "express";
import http from "node:http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadDatasets, computeMetrics, generateTimeline } from "./services/data-service.js";
import { registerPlaybackLoop } from "./services/playback-service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*"
  }
});

app.use(cors());
app.use(express.json());

app.get("/healthz", (_req, res) => {
  res.json({ status: "ok", service: "sentinel-fusion-backend" });
});

app.get("/api/v1/metrics", async (_req, res, next) => {
  try {
    const { edrEvents, ndrFlows } = await loadDatasets(DATA_DIR);
    const metrics = computeMetrics(edrEvents, ndrFlows);
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

app.get("/api/v1/alerts", async (req, res, next) => {
  try {
    const { edrEvents } = await loadDatasets(DATA_DIR);
    const { businessProcess, severity } = req.query;

    const filtered = edrEvents.filter((event) => {
      const matchBusiness = businessProcess
        ? (event.host?.business_process ?? "").toLowerCase() === businessProcess.toLowerCase()
        : true;
      const matchSeverity = severity ? (event.rule?.level ?? "").toLowerCase() === severity.toLowerCase() : true;
      return matchBusiness && matchSeverity;
    });

    res.json({ items: filtered, total: filtered.length });
  } catch (error) {
    next(error);
  }
});

app.get("/api/v1/flows", async (req, res, next) => {
  try {
    const { ndrFlows } = await loadDatasets(DATA_DIR);
    const { direction, businessProcess } = req.query;

    const filtered = ndrFlows.filter((flow) => {
      const matchDirection = direction ? (flow.network?.direction ?? "").toLowerCase() === direction.toLowerCase() : true;
      const flowBusiness =
        flow.source?.business_process ??
        flow.destination?.business_process ??
        "";
      const matchBusiness = businessProcess ? flowBusiness.toLowerCase() === businessProcess.toLowerCase() : true;
      return matchDirection && matchBusiness;
    });

    res.json({ items: filtered, total: filtered.length });
  } catch (error) {
    next(error);
  }
});

app.get("/api/v1/timeline", async (_req, res, next) => {
  try {
    const { edrEvents, ndrFlows } = await loadDatasets(DATA_DIR);
    const timeline = generateTimeline(edrEvents, ndrFlows);
    res.json({ items: timeline, total: timeline.length });
  } catch (error) {
    next(error);
  }
});

io.on("connection", (socket) => {
  socket.emit("connected", { message: "connected to sentinel fusion stream" });
});

registerPlaybackLoop(io, DATA_DIR);

app.use((error, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error("[backend] error occurred:", error);
  res.status(500).json({ message: "internal server error", detail: error.message });
});

const PORT = process.env.PORT ?? 5050;
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Sentinel Fusion backend running on http://localhost:${PORT}`);
});
