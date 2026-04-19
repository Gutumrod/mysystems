const express = require("express");
const http = require("http");
const { execFile } = require("child_process");
const { WebSocketServer } = require("ws");
const { buildStats } = require("./stats");

const PORT = Number(process.env.API_PORT || 4000);
const POWER_CONTROL_PIN = process.env.POWER_CONTROL_PIN || "2468";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json({ limit: "2kb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

app.get("/api/stats", async (_req, res) => {
  res.json(await buildStats());
});

app.post("/api/power", (req, res) => {
  const { action, pin } = req.body || {};

  if (pin !== POWER_CONTROL_PIN) {
    res.status(401).json({ ok: false, message: "BAD PIN // COMMAND DENIED" });
    return;
  }

  if (action === "hibernate") {
    runPowerCommand(["/h"], res, "HIBERNATE SIGNAL SENT");
    return;
  }

  if (action === "shutdown") {
    runPowerCommand(["/s", "/t", "5", "/c", "Remote dashboard shutdown"], res, "SHUTDOWN IN 5 SECONDS");
    return;
  }

  res.status(400).json({ ok: false, message: "UNKNOWN POWER ACTION" });
});

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

wss.on("connection", async (socket) => {
  socket.send(JSON.stringify(await buildStats()));
});

setInterval(async () => {
  const payload = JSON.stringify(await buildStats());

  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      client.send(payload);
    }
  }
}, 2000);

server.listen(PORT, () => {
  console.log(`Retro monitor API listening on http://localhost:${PORT}`);
});

function runPowerCommand(args, res, message) {
  execFile("shutdown", args, { windowsHide: true }, (error) => {
    if (error) {
      res.status(500).json({ ok: false, message: `POWER COMMAND FAILED // ${error.message}` });
      return;
    }

    res.json({ ok: true, message });
  });
}
