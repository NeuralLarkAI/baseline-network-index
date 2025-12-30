export const config = { runtime: "nodejs" };

const PUBLIC_RPC = "https://api.mainnet-beta.solana.com";
const TIMEOUT_MS = 2500;
const SAMPLES_PER_PROVIDER = 7;
const SLEEP_MS = 120;

// Baseline principle: proximity < execution reality.
// We don't reward sub-floor latency; we treat it as "good enough".
const EXECUTION_FLOOR_MS = 80;

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
  const x = clamp(ms, 5, 2500);
  const score = 110 - 20 * Math.log10(x);
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

function stabilityLabel(medLatency, jitterMs, failPct) {
  if (failPct >= 15) return "Degrading";
  if (medLatency >= 900) return "Degrading";
  if (jitterMs >= 180) return "Volatile";
  return "Stable";
}

function computeHealth(medLatency, jitterMs, failPct) {
  const ls = latencyScore(medLatency);
  const js = jitterScore(jitterMs);
  const fs = failureScore(failPct);
  return Math.round(ls * 0.52 + fs * 0.33 + js * 0.15);
}

async function sampleProvider(name, url) {
  const latencies = [];
  let failures = 0;

  for (let i = 0; i < SAMPLES_PER_PROVIDER; i++) {
    const method = i % 2 === 0 ? "getLatestBlockhash" : "getSlot";
    const params = [{ commitment: "confirmed" }];

    const start = Date.now();
    try {
      await rpcCall(url, method, params);
      latencies.push(Date.now() - start);
    } catch {
      failures += 1;
    }
    await sleep(SLEEP_MS);
  }

  if (latencies.length === 0) {
    return {
      name,
      ok: false,
      medLatency: 2000,
      jitterMs: 300,
      failPct: 100,
      health: 0,
    };
  }

  // Apply execution floor here
  const rawMedian = Math.round(median(latencies));
  const medLatency = Math.max(EXECUTION_FLOOR_MS, rawMedian);

  const jitterMs = Math.round(stdev(latencies));
  const failPct = Number(((failures / SAMPLES_PER_PROVIDER) * 100).toFixed(1));
  const health = computeHealth(medLatency, jitterMs, failPct);

  return {
    name,
    ok: failPct < 50,
    medLatency,
    jitterMs,
    failPct,
    health,
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

  const samples = await Promise.all(
    providers.map((p) => sampleProvider(p.name, p.url))
  );

  const best = [...samples].sort((a, b) => b.health - a.health)[0];

  const overallSuccessRate =
    100 - mean(samples.map((s) => s.failPct));

  let nqi = mean(samples.map((s) => s.health));

  const stability = stabilityLabel(best.medLatency, best.jitterMs, best.failPct);
  if (stability === "Volatile") nqi -= 3;
  if (stability === "Degrading") nqi -= 7;

  nqi = clamp(nqi, 0, 98);

  const rpcRankings = samples
    .sort((a, b) => b.health - a.health)
    .map((s, idx) => ({
      name: s.name,
      health: s.health,
      latencyMs: s.medLatency,
      errorRate: s.failPct,
      trend: idx === 0 ? "up" : "flat",
    }));

  const generationSeconds = Math.max(
    1,
    Math.round((Date.now() - started) / 1000)
  );

  res.status(200).json({
    nqi: Number(nqi.toFixed(1)),
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
    debug: {
      samplesPerProvider: SAMPLES_PER_PROVIDER,
      timeoutMs: TIMEOUT_MS,
      executionFloorMs: EXECUTION_FLOOR_MS,
      generationSeconds,
      best: {
        name: best.name,
        medLatency: best.medLatency,
        jitterMs: best.jitterMs,
        failPct: best.failPct,
        health: best.health,
      },
    },
  });
}
