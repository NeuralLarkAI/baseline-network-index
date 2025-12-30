export const config = { runtime: "edge" };

const PUBLIC_RPC = "https://api.mainnet-beta.solana.com";
const TIMEOUT_MS = 2500;
const SAMPLES_PER_PROVIDER = 7;
const SLEEP_MS = 120;
const EXECUTION_FLOOR_MS = 120;

// NOTE: Edge runtime persists per-region sometimes, but not guaranteed.
// We'll keep it simple: no EMA here (you already have it in Node).
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function mean(arr) {
  return arr.reduce((s, x) => s + x, 0) / arr.length;
}

function median(arr) {
  const a = [...arr].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

function stdev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const v = mean(arr.map((x) => (x - m) ** 2));
  return Math.sqrt(v);
}

async function rpcCall(url, method, params = []) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message || "RPC error");
    return json.result;
  } finally {
    clearTimeout(t);
  }
}

// Scoring tuned for your Baseline “stable looks ~90+” target
function latencyScore(ms) {
  const x = clamp(ms, 50, 2500);
  const score = 133 - 22 * Math.log10(x);
  return clamp(score, 0, 100);
}

function jitterScore(jitterMs) {
  const x = clamp(jitterMs, 0, 300);
  const score = 100 - (x / 250) * 100;
  return clamp(score, 0, 100);
}

function failureScore(failPct) {
  const x = clamp(failPct, 0, 50);
  const score = 100 - (x / 40) * 100;
  return clamp(score, 0, 100);
}

function slotLagPenalty(slotLag) {
  const x = clamp(slotLag, 0, 200);
  return (x / 200) * 25;
}

function computeBaseHealth(scoredLatency, jitterMs, failPct) {
  const ls = latencyScore(scoredLatency);
  const js = jitterScore(jitterMs);
  const fs = failureScore(failPct);
  return ls * 0.60 + fs * 0.33 + js * 0.07;
}

function stabilityLabel(scoredLatency, jitterMs, failPct) {
  if (failPct >= 15) return "Degrading";
  if (scoredLatency >= 900) return "Degrading";
  if (jitterMs >= 180) return "Volatile";
  return "Stable";
}

function validUrl(url) {
  if (!url) return null;
  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
}

async function sampleProvider(name, url) {
  const latencies = [];
  const slots = [];
  let failures = 0;

  // warmup (don’t count it)
  try {
    await rpcCall(url, "getSlot", [{ commitment: "confirmed" }]);
  } catch {
    // ignore warmup failure; samples will capture it
  }

  for (let i = 0; i < SAMPLES_PER_PROVIDER; i++) {
    const method = i % 2 === 0 ? "getLatestBlockhash" : "getSlot";
    const params = [{ commitment: "confirmed" }];

    const start = Date.now();
    try {
      const result = await rpcCall(url, method, params);
      latencies.push(Date.now() - start);
      if (method === "getSlot") slots.push(result);
    } catch {
      failures += 1;
    }

    await sleep(SLEEP_MS);
  }

  if (latencies.length === 0) {
    return {
      name,
      rawMedian: 2000,
      scoredLatency: 2000,
      jitterMs: 300,
      failPct: 100,
      slotMedian: 0,
      baseHealth: 0,
      health: 0,
    };
  }

  const rawMedian = Math.round(median(latencies));
  const scoredLatency = Math.max(EXECUTION_FLOOR_MS, rawMedian);
  const jitterMs = Math.round(stdev(latencies));
  const failPct = Number(((failures / SAMPLES_PER_PROVIDER) * 100).toFixed(1));
  const slotMedian = slots.length ? Math.round(median(slots)) : 0;

  const base = computeBaseHealth(scoredLatency, jitterMs, failPct);

  return {
    name,
    rawMedian,
    scoredLatency,
    jitterMs,
    failPct,
    slotMedian,
    baseHealth: base,
    health: Math.round(base),
  };
}

export default async function handler(req) {
  // IMPORTANT: Edge can read env vars, but make sure they’re set for Preview+Prod.
  const helius = validUrl(process.env.HELIUS_RPC);
  const quicknode = validUrl(process.env.QUICKNODE_RPC);

  const providers = [
    ...(quicknode ? [{ name: "QuickNode", url: quicknode }] : []),
    ...(helius ? [{ name: "Helius", url: helius }] : []),
    { name: "Public RPC", url: PUBLIC_RPC },
  ];

  const started = Date.now();

  let samples = await Promise.all(providers.map((p) => sampleProvider(p.name, p.url)));

  const bestSlot = Math.max(...samples.map((s) => s.slotMedian || 0));

  samples = samples.map((s) => {
    const slotLag = s.slotMedian ? Math.max(0, bestSlot - s.slotMedian) : 200;
    const penalty = slotLagPenalty(slotLag);
    const adjusted = clamp(s.baseHealth - penalty, 0, 100);
    return { ...s, slotLag, slotPenalty: Number(penalty.toFixed(1)), health: Math.round(adjusted) };
  });

  const overallSuccessRate = 100 - mean(samples.map((s) => s.failPct));

  // Trader headline = premium-weighted (public is a canary, not the driver)
  const quick = samples.find((s) => s.name === "QuickNode");
  const heli = samples.find((s) => s.name === "Helius");
  const pub = samples.find((s) => s.name === "Public RPC");

  const premium = [quick, heli].filter(Boolean);
  const premiumMean = premium.length ? mean(premium.map((s) => s.health)) : mean(samples.map((s) => s.health));

  let nqi = premiumMean;
  if (pub) {
    if (pub.failPct >= 30) nqi -= 4;
    else if (pub.failPct >= 15) nqi -= 2;
  }

  const best = [...samples].sort((a, b) => b.health - a.health)[0];
  const stability = stabilityLabel(best.scoredLatency, best.jitterMs, best.failPct);

  if (stability === "Volatile") nqi -= 3;
  if (stability === "Degrading") nqi -= 7;

  nqi = clamp(nqi, 0, 98);

  const retryPressure =
    overallSuccessRate >= 97 ? "Low" : overallSuccessRate >= 90 ? "Medium" : "High";

  const context =
    overallSuccessRate >= 95 && stability === "Stable"
      ? "Trader-region execution remains above baseline. Current conditions favor standard routing."
      : overallSuccessRate >= 88
      ? "Execution is stable, but elevated retries detected on some routes in this region."
      : "Execution quality is stressed in this region. Expect retries and inconsistent confirmation latency.";

  const rpcRankings = samples
    .sort((a, b) => b.health - a.health)
    .map((s, idx) => ({
      name: s.name,
      health: s.health,
      latencyMs: s.rawMedian,
      errorRate: s.failPct,
      trend: idx === 0 ? "up" : "flat",
    }));

  const generationSeconds = Math.max(1, Math.round((Date.now() - started) / 1000));

  // Helpful stamps
  const deployment = process.env.VERCEL_URL || "unknown";

  return new Response(
    JSON.stringify({
      nqi: Number(nqi.toFixed(1)),
      successRate: Number(clamp(overallSuccessRate, 0, 100).toFixed(1)),
      latencyStability: stability,
      feeEfficiency: 0.00002,
      retryPressure,
      updatedSecondsAgo: 0,
      rpcRankings,
      context,
      deployment,
      debug: {
        edge: true,
        samplesPerProvider: SAMPLES_PER_PROVIDER,
        timeoutMs: TIMEOUT_MS,
        executionFloorMs: EXECUTION_FLOOR_MS,
        generationSeconds,
        bestSlot,
      },
    }),
    { headers: { "content-type": "application/json", "cache-control": "no-store" } }
  );
}
