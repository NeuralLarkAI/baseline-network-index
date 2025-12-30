export const config = { runtime: "nodejs" };

const PUBLIC_RPC = "https://api.mainnet-beta.solana.com";
const TIMEOUT_MS = 2500;
const SAMPLES_PER_PROVIDER = 7;
const SLEEP_MS = 120;

// Baseline: don't reward datacenter proximity for scoring.
// We floor latency for scoring, but still display the true measured median.
const EXECUTION_FLOOR_MS = 120;

// Smooth the headline NQI so it doesn’t whipsaw between samples
let LAST_NQI = null;
const EMA_ALPHA = 0.25; // 0.15 = smoother, 0.35 = snappier

function validUrl(url) {
  if (!url) return null;
  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
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

function median(arr) {
  const a = [...arr].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

function mean(arr) {
  return arr.reduce((s, x) => s + x, 0) / arr.length;
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function stdev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const v = mean(arr.map((x) => (x - m) ** 2));
  return Math.sqrt(v);
}

function latencyScore(ms) {
  // Scored latency is already floored (EXECUTION_FLOOR_MS).
  // Curve tuned so stable conditions read high but congestion still punishes.
  const x = clamp(ms, 50, 2500);

  // Tuned curve:
  // 120ms  -> ~87
  // 300ms  -> ~79
  // 600ms  -> ~71
  // 1500ms -> ~63
  // 2500ms -> ~58
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

// Slot-lag penalty: 0 lag = 0 penalty; 200 slots lag = 25 point penalty
function slotLagPenalty(slotLag) {
  const x = clamp(slotLag, 0, 200);
  return (x / 200) * 25;
}

function stabilityLabel(scoredLatency, jitterMs, failPct) {
  if (failPct >= 15) return "Degrading";
  if (scoredLatency >= 900) return "Degrading";
  if (jitterMs >= 180) return "Volatile";
  return "Stable";
}

function computeBaseHealth(scoredLatency, jitterMs, failPct) {
  const ls = latencyScore(scoredLatency);
  const js = jitterScore(jitterMs);
  const fs = failureScore(failPct);

  // Final tuned weights:
  // - latency is primary
  // - failures matter a lot
  // - jitter matters, but shouldn't drag stable conditions too low
  return ls * 0.60 + fs * 0.33 + js * 0.07;
}

async function sampleProvider(name, url) {
  const latencies = [];
  const slots = [];
  let failures = 0;

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
      ok: false,
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
    ok: failPct < 50,
    rawMedian,
    scoredLatency,
    jitterMs,
    failPct,
    slotMedian,
    baseHealth: base,
    health: Math.round(base), // adjusted later with slot lag
  };
}

export default async function handler(req, res) {
  const helius = validUrl(process.env.HELIUS_RPC);
  const quicknode = validUrl(process.env.QUICKNODE_RPC);

  const providers = [
    ...(quicknode ? [{ name: "QuickNode", url: quicknode }] : []),
    ...(helius ? [{ name: "Helius", url: helius }] : []),
    { name: "Public RPC", url: PUBLIC_RPC },
  ];

  const started = Date.now();

  let samples = await Promise.all(
    providers.map((p) => sampleProvider(p.name, p.url))
  );

  const bestSlot = Math.max(...samples.map((s) => s.slotMedian || 0));

  // Apply slot-lag penalty and finalize health
  samples = samples.map((s) => {
    const slotLag = s.slotMedian ? Math.max(0, bestSlot - s.slotMedian) : 200;
    const penalty = slotLagPenalty(slotLag);
    const adjusted = clamp(s.baseHealth - penalty, 0, 100);

    return {
      ...s,
      slotLag,
      slotPenalty: Number(penalty.toFixed(1)),
      health: Math.round(adjusted),
    };
  });

  const best = [...samples].sort((a, b) => b.health - a.health)[0];

  const overallSuccessRate = 100 - mean(samples.map((s) => s.failPct));

  // Raw NQI
  const quick = samples.find((s) => s.name === "QuickNode");
const heli = samples.find((s) => s.name === "Helius");
const pub = samples.find((s) => s.name === "Public RPC");

const premium = [quick, heli].filter(Boolean);
const premiumMean = premium.length ? mean(premium.map((s) => s.health)) : mean(samples.map((s) => s.health));

// Headline is driven by premium routes; public is a light penalty signal.
let nqi = premiumMean;

// If public is failing badly, apply a small penalty (doesn't dominate).
if (pub) {
  if (pub.failPct >= 30) nqi -= 4;
  else if (pub.failPct >= 15) nqi -= 2;
}


  const stability = stabilityLabel(best.scoredLatency, best.jitterMs, best.failPct);
  if (stability === "Volatile") nqi -= 3;
  if (stability === "Degrading") nqi -= 7;

  // Avoid perfect scores in infra indexes
  nqi = clamp(nqi, 0, 98);

  // EMA smoothing (reduces 66 ↔ 92 whiplash)
  if (LAST_NQI === null) LAST_NQI = nqi;
  else LAST_NQI = LAST_NQI * (1 - EMA_ALPHA) + nqi * EMA_ALPHA;

  const smoothedNqi = clamp(LAST_NQI, 0, 98);

  const rpcRankings = samples
    .sort((a, b) => b.health - a.health)
    .map((s, idx) => ({
      name: s.name,
      health: s.health,
      latencyMs: s.rawMedian, // display true measured median
      errorRate: s.failPct,   // % failures in sample
      trend: idx === 0 ? "up" : "flat",
    }));

  const generationSeconds = Math.max(
    1,
    Math.round((Date.now() - started) / 1000)
  );

  res.status(200).json({
    // Smoothed headline
    nqi: Number(smoothedNqi.toFixed(1)),

    // Still expose the raw score for debugging
    nqiRaw: Number(nqi.toFixed(1)),

    successRate: Number(clamp(overallSuccessRate, 0, 100).toFixed(1)),
    latencyStability: stability,
    feeEfficiency: 0.00002,
    retryPressure:
      overallSuccessRate >= 97 ? "Low" : overallSuccessRate >= 90 ? "Medium" : "High",
    updatedSecondsAgo: 0,
    rpcRankings,
    context:
      stability === "Stable"
        ? "Transaction execution remains above baseline. Current conditions favor standard routing."
        : stability === "Volatile"
        ? "Latency volatility detected. Consider conservative routing during congestion."
        : "Execution quality is degraded. Expect higher retries and inconsistent confirmation latency.",

    // Deployment stamp (proves whether UI is hitting multiple deployments)
    build: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "local",
    deployment: process.env.VERCEL_URL || "unknown",

    debug: {
      samplesPerProvider: SAMPLES_PER_PROVIDER,
      timeoutMs: TIMEOUT_MS,
      executionFloorMs: EXECUTION_FLOOR_MS,
      emaAlpha: EMA_ALPHA,
      generationSeconds,
      bestSlot,
      providers: samples.map((s) => ({
        name: s.name,
        rawMedian: s.rawMedian,
        scoredLatency: s.scoredLatency,
        jitterMs: s.jitterMs,
        failPct: s.failPct,
        slotMedian: s.slotMedian,
        slotLag: s.slotLag,
        slotPenalty: s.slotPenalty,
        health: s.health,
      })),
      best: {
        name: best.name,
        rawMedian: best.rawMedian,
        scoredLatency: best.scoredLatency,
        jitterMs: best.jitterMs,
        failPct: best.failPct,
        slotMedian: best.slotMedian,
        slotLag: best.slotLag,
        health: best.health,
      },
    },
  });
}
