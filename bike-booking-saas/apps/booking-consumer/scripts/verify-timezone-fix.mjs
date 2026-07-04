#!/usr/bin/env node
// ponytail: mirrors lib/utils.ts — keep in sync if these functions change

const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

function parseBangkokDateTime(dateStr, timeStr = "00:00") {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - BANGKOK_OFFSET_MS);
}

function formatBangkokTime(date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

const WEEKDAY_SHORT_TO_KEY = {
  Sun: "sun", Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat"
};

function toWeekdayKey(date) {
  const short = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", weekday: "short" }).format(date);
  return WEEKDAY_SHORT_TO_KEY[short];
}

function formatBangkokISODate(date) {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

// --- Tests ---

let failures = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    failures++;
  } else {
    console.log(`PASS: ${message}`);
  }
}

const tz = process.env.TZ || "(default)";
console.log(`TZ=${tz}`);

// Test 1: toWeekdayKey for Saturday
const saturday = new Date(Date.UTC(2026, 6, 3, 17, 0, 0)); // 2026-07-04 00:00 ICT = 2026-07-03 17:00 UTC
const key = toWeekdayKey(saturday);
assert(key === "sat", `toWeekdayKey for Saturday should be "sat", got "${key}"`);

// Test 2: parseBangkokDateTime + 3 hours → formatBangkokTime should be '01:00' (crosses midnight Bangkok)
const dt = parseBangkokDateTime("2026-07-04", "22:00");
const dtPlus3 = addHours(dt, 3);
const timeStr = formatBangkokTime(dtPlus3);
assert(timeStr === "01:00", `parseBangkokDateTime('2026-07-04', '22:00') + 3h should be '01:00' Bangkok, got '${timeStr}'`);

// Test 3: formatBangkokISODate consistency
const iso = formatBangkokISODate(dt);
assert(iso === "2026-07-04", `formatBangkokISODate of parseBangkokDateTime('2026-07-04') should be '2026-07-04', got '${iso}'`);

// Test 4: parseBangkokDateTime('2026-07-04', '00:00') should be Bangkok midnight
const midnight = parseBangkokDateTime("2026-07-04", "00:00");
const midnightIso = formatBangkokISODate(midnight);
assert(midnightIso === "2026-07-04", `Bangkok midnight should be '2026-07-04', got '${midnightIso}'`);

// Test 5: toWeekdayKey for same instant should be same across all TZ
const sameInstant = new Date(Date.UTC(2026, 6, 4, 10, 0, 0)); // 2026-07-04 17:00 ICT
const wk = toWeekdayKey(sameInstant);
assert(wk === "sat", `toWeekdayKey for 2026-07-04 17:00 ICT should be "sat", got "${wk}"`);

// Test 6: formatBangkokISODate of now should be Bangkok date, not local
const now = new Date();
const nowIso = formatBangkokISODate(now);
// We can't assert a specific value, but we can assert it's a valid ISO date string
assert(/^\d{4}-\d{2}-\d{2}$/.test(nowIso), `formatBangkokISODate(now) should be valid ISO date, got '${nowIso}'`);

console.log(`\nPassed: ${6 - failures}, Failed: ${failures}`);
if (failures > 0) {
  console.error(`❌ ${failures} TEST(S) FAILED`);
  process.exit(1);
} else {
  console.log("✅ All timezone fix assertions passed");
}
