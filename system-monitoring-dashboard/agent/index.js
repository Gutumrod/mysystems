const { execFile } = require("child_process");
const path = require("path");
const admin = require("firebase-admin");
const { buildStats } = require("../server/stats");

const DEVICE_ID = process.env.DEVICE_ID || "home-pc";
const POLL_INTERVAL_MS = Number(process.env.AGENT_POLL_INTERVAL_MS || 5000);
const POWER_CONTROL_PIN = process.env.POWER_CONTROL_PIN || "2468";

admin.initializeApp({
  credential: loadCredential()
});

const db = admin.firestore();
const statusRef = db.doc(`devices/${DEVICE_ID}/status/current`);
const commandsRef = db.collection(`devices/${DEVICE_ID}/commands`);

console.log(`Retro monitor agent online for device "${DEVICE_ID}"`);

async function tick() {
  await pushStatus();
  await processCommands();
}

tick().catch((error) => console.error("Agent startup tick failed:", error));
setInterval(() => {
  tick().catch((error) => console.error("Agent tick failed:", error));
}, POLL_INTERVAL_MS);

async function pushStatus() {
  const stats = await buildStats();

  await statusRef.set(
    {
      ...stats,
      deviceId: DEVICE_ID,
      lastSeenMs: Date.now(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

async function processCommands() {
  const snapshot = await commandsRef.where("status", "==", "pending").limit(5).get();

  for (const doc of snapshot.docs) {
    const command = doc.data();
    const action = command.action;
    const pin = command.pin;
    const expiresAtMs = Number(command.expiresAtMs || 0);

    if (expiresAtMs && Date.now() > expiresAtMs) {
      await doc.ref.update({
        status: "expired",
        result: "COMMAND EXPIRED",
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      continue;
    }

    if (pin !== POWER_CONTROL_PIN) {
      await doc.ref.update({
        status: "denied",
        result: "BAD PIN // COMMAND DENIED",
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      continue;
    }

    if (action === "hibernate") {
      await runPowerCommand(["/h"]);
      await markDone(doc.ref, "HIBERNATE SIGNAL SENT");
      continue;
    }

    if (action === "shutdown") {
      await runPowerCommand(["/s", "/t", "5", "/c", "Remote dashboard shutdown"]);
      await markDone(doc.ref, "SHUTDOWN IN 5 SECONDS");
      continue;
    }

    await doc.ref.update({
      status: "rejected",
      result: "UNKNOWN POWER ACTION",
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

async function markDone(ref, result) {
  await ref.update({
    status: "done",
    result,
    completedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

function runPowerCommand(args) {
  return new Promise((resolve, reject) => {
    execFile("shutdown", args, { windowsHide: true }, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function loadCredential() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
  }

  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, "service-account.json");
  return admin.credential.cert(require(keyPath));
}
