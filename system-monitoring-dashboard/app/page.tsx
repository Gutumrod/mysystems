"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { addDoc, collection, doc, getFirestore, onSnapshot, serverTimestamp } from "firebase/firestore";
import { getFirebaseApp, isFirebaseMode } from "../lib/firebaseClient";

type MonitorStats = {
  n8nStatus: "ONLINE" | "OFFLINE";
  ollamaStatus: "READY" | "SLEEPING";
  ramUsage: number;
  cpuUsage: number;
  gpuUsage: number;
  gpuTemp: number | null;
  gpuMemoryUsed: number;
  gpuMemoryTotal: number;
  gpuMemoryUsage: number;
  gpuPowerDraw: number | null;
  cpuTemp: number;
  lastError: string;
  uptimeSeconds: number;
  timestamp: string;
};

type IncomingStats = Partial<MonitorStats> & {
  lmStudioStatus?: "READY" | "SLEEPING";
};

type PowerAction = "hibernate" | "shutdown";

const fallbackStats: MonitorStats = {
  n8nStatus: "ONLINE",
  ollamaStatus: "READY",
  ramUsage: 48,
  cpuUsage: 16,
  gpuUsage: 24,
  gpuTemp: null,
  gpuMemoryUsed: 0,
  gpuMemoryTotal: 0,
  gpuMemoryUsage: 0,
  gpuPowerDraw: null,
  cpuTemp: 52,
  lastError: "NO ERROR // SYSTEM NOMINAL",
  uptimeSeconds: 1337,
  timestamp: "1970-01-01T00:00:00.000Z"
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatTimer(seconds: number) {
  const hrs = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const mins = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${hrs}:${mins}:${secs}`;
}

function normalizeStats(payload: IncomingStats): MonitorStats {
  return {
    ...fallbackStats,
    ...payload,
    ollamaStatus: payload.ollamaStatus ?? payload.lmStudioStatus ?? fallbackStats.ollamaStatus,
    cpuUsage: payload.cpuUsage ?? fallbackStats.cpuUsage
  };
}

function formatGpuMemory(used: number, total: number) {
  if (!total) return "N/A";
  return `${Math.round(used / 1024)}GB / ${Math.round(total / 1024)}GB`;
}

function formatNullableMetric(value: number | null, suffix: string) {
  return value === null ? "N/A" : `${value}${suffix}`;
}

function getApiBaseUrl() {
  const protocol = window.location.protocol;
  return `${protocol}//${window.location.hostname}:4000`;
}

function getDeviceId() {
  return process.env.NEXT_PUBLIC_DEVICE_ID || "home-pc";
}

function useCloudAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!isFirebaseMode());

  useEffect(() => {
    if (!isFirebaseMode()) return;

    try {
      const auth = getAuth(getFirebaseApp());
      return onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser);
        setReady(true);
      });
    } catch {
      setReady(true);
    }
  }, []);

  async function login() {
    const auth = getAuth(getFirebaseApp());
    await signInWithPopup(auth, new GoogleAuthProvider());
  }

  async function logout() {
    const auth = getAuth(getFirebaseApp());
    await signOut(auth);
  }

  return { user, ready, login, logout };
}

function useMonitorStats(user: User | null, authReady: boolean) {
  const [stats, setStats] = useState<MonitorStats>(fallbackStats);
  const [connected, setConnected] = useState(false);
  const [localTick, setLocalTick] = useState(0);
  const lastErrorRef = useRef(fallbackStats.lastError);

  useEffect(() => {
    if (isFirebaseMode()) {
      if (!authReady) return;

      if (!user) {
        setConnected(false);
        setStats((current) => ({
          ...current,
          lastError: "LOGIN REQUIRED // GOOGLE AUTH"
        }));
        return;
      }

      try {
        const db = getFirestore(getFirebaseApp());
        const statusRef = doc(db, "devices", getDeviceId(), "status", "current");

        return onSnapshot(
          statusRef,
          (snapshot) => {
            if (!snapshot.exists()) {
              setConnected(false);
              setStats((current) => ({
                ...current,
                lastError: "NO CLOUD PACKET // AGENT NOT SEEN"
              }));
              return;
            }

            const nextStats = normalizeStats(snapshot.data() as IncomingStats);
            setConnected(true);

            if (nextStats.lastError && nextStats.lastError !== lastErrorRef.current) {
              lastErrorRef.current = nextStats.lastError;
              playErrorBeep();
            }

            setStats(nextStats);
          },
          () => {
            setConnected(false);
            setStats((current) => ({
              ...current,
              lastError: "FIRESTORE LINK FAILED // CHECK CONFIG"
            }));
          }
        );
      } catch {
        setConnected(false);
        setStats((current) => ({
          ...current,
          lastError: "FIREBASE CONFIG MISSING // LOCAL MODE NEEDED"
        }));
        return;
      }
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = process.env.NEXT_PUBLIC_WS_URL ?? `${protocol}//${window.location.hostname}:4000`;
    const ws = new WebSocket(url);

    ws.addEventListener("open", () => setConnected(true));
    ws.addEventListener("close", () => setConnected(false));
    ws.addEventListener("error", () => setConnected(false));
    ws.addEventListener("message", (event) => {
      try {
        const nextStats = normalizeStats(JSON.parse(event.data) as IncomingStats);

        if (nextStats.lastError && nextStats.lastError !== lastErrorRef.current) {
          lastErrorRef.current = nextStats.lastError;
          playErrorBeep();
        }

        setStats(nextStats);
      } catch {
        setStats((current) => ({
          ...current,
          lastError: "PACKET PARSE ERROR // CHECK WS STREAM"
        }));
      }
    });

    return () => ws.close();
  }, [authReady, user]);

  useEffect(() => {
    const id = window.setInterval(() => setLocalTick((tick) => tick + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  return {
    stats: {
      ...stats,
      uptimeSeconds: stats.uptimeSeconds + localTick
    },
    connected
  };
}

function playErrorBeep() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const ctx = new AudioContextClass();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "square";
  oscillator.frequency.value = 220;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.2);
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

function PixelIndicator({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="status-chip">
      <span className={`pixel-led ${active ? "is-on" : "is-off"}`} />
      <div>
        <p className="tiny-label">{label}</p>
        <p className={active ? "text-ega-brightgreen" : "text-ega-brightred"}>{active ? "ONLINE" : "OFFLINE"}</p>
      </div>
    </div>
  );
}

function Robot({ state }: { state: MonitorStats["ollamaStatus"] }) {
  return (
    <div className={`robot ${state === "READY" ? "is-ready" : "is-sleeping"}`} aria-label={`Ollama ${state}`}>
      <div className="robot-antenna" />
      <div className="robot-head">
        <span />
        <span />
      </div>
      <div className="robot-body">
        <i />
        <i />
        <i />
      </div>
      <div className="robot-feet">
        <b />
        <b />
      </div>
    </div>
  );
}

function Meter({ label, value, hot }: { label: string; value: number; hot?: boolean }) {
  const blocks = 20;
  const filled = Math.round((clamp(value) / 100) * blocks);

  return (
    <div className="meter-panel">
      <div className="flex items-center justify-between gap-3">
        <p className="panel-title">{label}</p>
        <p className={hot ? "text-ega-brightred" : "text-ega-yellow"}>{clamp(value)}%</p>
      </div>
      <div className="retro-bar" aria-label={`${label} ${value}%`}>
        {Array.from({ length: blocks }, (_, index) => (
          <span key={index} className={index < filled ? "filled" : ""} />
        ))}
      </div>
    </div>
  );
}

function MetricTile({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="metric-tile">
      <p className="tiny-label">{label}</p>
      <p className={alert ? "metric-value text-ega-brightred" : "metric-value text-ega-brightcyan"}>{value}</p>
    </div>
  );
}

function Flame({ active }: { active: boolean }) {
  return (
    <div className={`flame ${active ? "is-active" : ""}`} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

function Thermometer({ temp }: { temp: number }) {
  const height = Math.max(16, Math.min(92, temp));
  const hot = temp >= 75;

  return (
    <div className="thermo-wrap">
      <div className="thermo">
        <div className={hot ? "thermo-mercury hot" : "thermo-mercury"} style={{ height: `${height}%` }} />
      </div>
      <div className="thermo-bulb" />
    </div>
  );
}

function DosBox({ message }: { message: string }) {
  return (
    <div className="dos-box">
      <div className="dos-title">C:\SYS\LAST_ERROR.LOG</div>
      <p className="scroll-text">&gt; {message}</p>
    </div>
  );
}

function PowerControls() {
  const [action, setAction] = useState<PowerAction | null>(null);
  const [pin, setPin] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("REMOTE POWER ARMED // PIN REQUIRED");

  async function submitPowerCommand() {
    if (!action || pending) return;

    setPending(true);
    setMessage("SENDING COMMAND...");

    try {
      if (isFirebaseMode()) {
        const auth = getAuth(getFirebaseApp());
        if (!auth.currentUser) {
          setMessage("LOGIN REQUIRED // COMMAND DENIED");
          return;
        }

        const db = getFirestore(getFirebaseApp());
        await addDoc(collection(db, "devices", getDeviceId(), "commands"), {
          action,
          pin,
          status: "pending",
          createdAt: serverTimestamp(),
          expiresAtMs: Date.now() + 60_000,
          source: "dashboard"
        });

        setMessage("COMMAND QUEUED // AGENT WILL EXECUTE");
        setAction(null);
        setPin("");
        return;
      }

      const response = await fetch(`${getApiBaseUrl()}/api/power`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, pin })
      });
      const body = (await response.json()) as { ok: boolean; message: string };

      setMessage(body.message);

      if (body.ok) {
        setAction(null);
        setPin("");
      }
    } catch {
      setMessage("POWER LINK FAILED // CHECK TAILSCALE OR API");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="monitor-panel power-panel">
      <div className="panel-head">
        <p className="panel-title">REMOTE POWER</p>
        <p className="blink">DANGER ZONE</p>
      </div>
      <p className="tiny-label power-message">{message}</p>
      <div className="power-actions">
        <button className="power-button hibernate" type="button" onClick={() => setAction("hibernate")}>
          HIBERNATE PC
        </button>
        <button className="power-button shutdown" type="button" onClick={() => setAction("shutdown")}>
          SHUTDOWN PC
        </button>
      </div>

      {action ? (
        <div className="power-modal" role="dialog" aria-modal="true" aria-label={`${action} confirmation`}>
          <div className="power-modal-box">
            <p className="panel-title">{action === "hibernate" ? "CONFIRM HIBERNATE" : "CONFIRM SHUTDOWN"}</p>
            <p className="tiny-label">
              {action === "hibernate"
                ? "WINDOWS WILL SAVE SESSION AND SLEEP."
                : "RUNNING APPS WILL CLOSE. UNSAVED WORK MAY BE LOST."}
            </p>
            <input
              className="pin-input"
              inputMode="numeric"
              maxLength={12}
              placeholder="ENTER PIN"
              type="password"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void submitPowerCommand();
                }
              }}
            />
            <div className="modal-actions">
              <button
                className="power-button"
                type="button"
                onClick={() => {
                  setAction(null);
                  setPin("");
                  setMessage("REMOTE POWER ARMED // PIN REQUIRED");
                }}
              >
                CANCEL
              </button>
              <button className="power-button shutdown" disabled={!pin || pending} type="button" onClick={submitPowerCommand}>
                {pending ? "WAIT..." : "CONFIRM"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default function DashboardPage() {
  const auth = useCloudAuth();
  const { stats, connected } = useMonitorStats(auth.user, auth.ready);
  const [hydrated, setHydrated] = useState(false);
  const gpuHot = stats.gpuUsage >= 75;
  const gpuThermalHot = stats.gpuTemp !== null && stats.gpuTemp >= 85;
  const vramHot = stats.gpuMemoryUsage >= 90;
  const cpuHot = stats.cpuTemp >= 75;
  const cpuBusy = stats.cpuUsage >= 80;
  const n8nOnline = stats.n8nStatus === "ONLINE";
  const ollamaReady = stats.ollamaStatus === "READY";
  const bootLine = useMemo(
    () => (hydrated ? new Date(stats.timestamp).toLocaleString("th-TH") : "WAITING FOR PACKET"),
    [hydrated, stats.timestamp]
  );

  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-ega-black text-ega-lightgray">
      <section className="arcade-shell">
        <div className="cabinet-lights" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="crt-screen">
          <div className="screen-content">
            <header className="hud-header">
              <div>
                <p className="tiny-label text-ega-cyan">ARCADE SYSTEM OPS</p>
                <h1>RETRO MONITOR</h1>
              </div>
              <div className="coin-slot">
                <span className={connected ? "bg-ega-brightgreen" : "bg-ega-brightred"} />
                {connected ? "WS LINK" : "DEMO MODE"}
              </div>
              {isFirebaseMode() ? (
                <button
                  className="cloud-auth-button"
                  type="button"
                  onClick={() => {
                    void (auth.user ? auth.logout() : auth.login());
                  }}
                >
                  {auth.user ? "LOGOUT" : "LOGIN"}
                </button>
              ) : null}
            </header>

            <div className="dashboard-grid">
              <section className="monitor-panel span-2">
                <div className="panel-head">
                  <p className="panel-title">SERVICE MATRIX</p>
                  <p className="blink">INSERT COIN</p>
                </div>
                <div className="service-row">
                  <PixelIndicator label="n8n STATUS" active={n8nOnline} />
                  <div className="ai-card">
                    <Robot state={stats.ollamaStatus} />
                    <div>
                      <p className="tiny-label">OLLAMA AI</p>
                      <p className={ollamaReady ? "text-ega-brightcyan" : "text-ega-yellow"}>{stats.ollamaStatus}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="monitor-panel timer-panel">
                <p className="panel-title">UPTIME</p>
                <p className="arcade-timer">{formatTimer(stats.uptimeSeconds)}</p>
                <p className="tiny-label">LAST PACKET {bootLine}</p>
              </section>

              <section className="monitor-panel">
                <Meter label="RAM USAGE" value={stats.ramUsage} />
              </section>

              <section className="monitor-panel">
                <Meter label="CPU LOAD" value={stats.cpuUsage} hot={cpuBusy} />
                <p className={cpuBusy ? "tiny-label text-ega-brightred" : "tiny-label text-ega-brightgreen"}>
                  {cpuBusy ? "BUSY // MODEL WORKLOAD" : "READY // TASK ROOM"}
                </p>
              </section>

              <section className="monitor-panel gpu-panel">
                <Meter label="GPU LOAD" value={stats.gpuUsage} hot={gpuHot} />
                <p className={gpuHot ? "tiny-label text-ega-brightred" : "tiny-label text-ega-brightgreen"}>
                  {gpuHot ? "ACTIVE COMPUTE LOAD" : "LOW COMPUTE LOAD"}
                </p>
                <Flame active={gpuHot} />
              </section>

              <section className="monitor-panel">
                <Meter label="VRAM USED" value={stats.gpuMemoryUsage} hot={vramHot} />
                <p className={vramHot ? "tiny-label text-ega-brightred" : "tiny-label text-ega-brightgreen"}>
                  {formatGpuMemory(stats.gpuMemoryUsed, stats.gpuMemoryTotal)}
                </p>
                <p className="tiny-label text-ega-lightgray">MODEL MEMORY RESERVATION</p>
              </section>

              <section className="monitor-panel">
                <div className="metric-grid">
                  <MetricTile
                    alert={gpuThermalHot}
                    label="GPU TEMP"
                    value={formatNullableMetric(stats.gpuTemp, "C")}
                  />
                  <MetricTile label="GPU POWER" value={formatNullableMetric(stats.gpuPowerDraw, "W")} />
                </div>
                <p className={gpuThermalHot ? "tiny-label text-ega-brightred" : "tiny-label text-ega-brightgreen"}>
                  {gpuThermalHot ? "THERMAL WATCH" : "GPU COOLING OK"}
                </p>
              </section>

              <section className="monitor-panel temp-panel">
                <div>
                  <p className="panel-title">CPU TEMP</p>
                  <p className={cpuHot ? "temp-readout text-ega-brightred" : "temp-readout text-ega-brightgreen"}>
                    {Math.round(stats.cpuTemp)}C
                  </p>
                  <p className="tiny-label">{cpuHot ? "THERMAL ALERT" : "COOLANT OK"}</p>
                </div>
                <Thermometer temp={stats.cpuTemp} />
              </section>

              <section className="monitor-panel span-2">
                <DosBox message={stats.lastError} />
              </section>

              <PowerControls />
            </div>
          </div>
        </div>

        <div className="control-deck" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </section>
    </main>
  );
}
