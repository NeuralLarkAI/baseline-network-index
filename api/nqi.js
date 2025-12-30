export const config = { runtime: "nodejs" };

const PUBLIC_RPC = "https://api.mainnet-beta.solana.com";
const TIMEOUT_MS = 2500;
const SAMPLES_PER_PROVIDER = 5;

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

function stdev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const v = mean(arr.map((x) => (x - m) ** 2));
  return Math.sqrt(v);
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function stabilityLabel(medLatency, jitterMs, failPct) {
  if (failPct >= 20) return "Degrading";
  if (medLatency >= 900) return "Degrading";
  if (jitterMs >= 200) return "Volatile";
  return "Stable";
}

// Health score: 0..100
function healthScore(medLatency, failPct, jitterMs) {
  // latency score: 0 (>=1500ms) .. 100 (<=150ms)
  const latencyScore = clamp(100 - ((medLatency - 150) / (1500 - 150)) * 100, 0, 100);

  // failure score: 0 (>=40% fails) .. 100 (0% fails)
  const failScore = clamp(100 - (failPct / 40) * 100, 0, 100);

  // jitter score: 0 (>=400ms jitter) .. 100 (<=20ms)
  const jitterScore = clamp(100 - ((jitterMs - 20) / (400 - 20)) * 100, 0, 100);

  // weights tuned for “execution quality”
  return Math.round(latencyScore * 0.5 + failScore * 0.35 + jitterScore * 0.15);
}

async function sampleProvider(name, url) {
  const latencies = [];
  let failures = 0;

  // small spacing prevents “burst luck”
  for (let i = 0; i < SAMPLES_PER_PROVIDER; i++) {
    const start = Date.now();
    try {
      await rpcCall(url, "getSlot", [{ commitment: "confirmed" }]);
      latencies.push(Date.now() - start);
    } catch {
      failures += 1;
    }
    await sleep(120);
  }

  // If everything failed, return heavy penalty
  if (latencies.length === 0) {
    return {
      name,
      ok: false,
      medLatency: 2000,
      jitterMs: 500,
      failPct: 100,
      health: 0,
      trend: "down",
    };
  }

  const medLatency = median(latencies);
  const jitterMs = Math.round(stdev(latencies));
  const failPct = (failures / SAMPLES_PER_PROVIDER) * 100;
  const health = healthScore(medLatency, failPct, jitterMs);

  return {
    name,
    ok: failPct < 50,
    medLatency: Math.round(medLatency),
    jitterMs,
    failPct: Number(failPct.toFixed(1)),
    health,
    trend: "flat",
  };
}

export default async function handler(req, res) {
  const helius = validUrl(process.env.HELIUS_RPC);
  const quicknode = validUrl(process.env.QUICKNODE_RPC);

  const providers = [
    ...(helius ? [{ name: "Helius", url: helius }] : []),
    ...(quicknode ? [{ name: "QuickNode", url: quicknode }] : []),
    { name: "Public RPC", url: PUBLIC_RPC },
  ];

  const started = Date.now();

  const samples = await Promise.all(
    providers.map((p) => sampleProvider(p.name, p.url))
  );

  // Overall metrics across providers
  const overallSuccessRate =
    100 -
    mean(samples.map((s) => s.failPct));

  const best = [...samples].sort((a, b) => b.health - a.health)[0];

  // NQI = average of health scores, but penalize if best provider is degrading
  let nqi = mean(samples.map((s) => s.health));
  if (best.failPct >= 20) nqi -= 7;
  if (best.medLatency >= 900) nqi -= 7;
  nqi = clamp(nqi, 0, 100);

  const latencyStability = stabilityLabel(best.medLatency, best.jitterMs, best.failPct);

  const rpcRankings = samples
    .sort((a, b) => b.health - a.health)
    .map((s, idx) => ({
      name: s.name,
      health: s.health,
      latencyMs: s.medLatency,
      errorRate: s.failPct, // now REAL (% failures in sample)
      trend: idx === 0 ? "up" : s.trend,
    }));

  const elapsedSeconds = Math.max(1, Math.round((Date.now() - started) / 1000));

  res.status(200).json({
    nqi: Number(nqi.toFixed(1)),
    successRate: Number(clamp(overallSuccessRate, 0, 100).toFixed(1)),
    latencyStability,
    feeEfficiency: 0.00002, // still placeholder; we’ll make real later
    retryPressure: overallSuccessRate >= 97 ? "Low" : overallSuccessRate >= 90 ? "Medium" : "High",
    updatedSecondsAgo: 0,
    rpcRankings,
    context:
      latencyStability === "Stable"
        ? "Transaction execution remains above baseline. Current conditions favor standard routing."
        : latencyStability === "Volatile"
        ? "Latency volatility detected. Consider conservative routing during congestion."
        : "Execution quality is degraded. Expect higher retries and inconsistent confirmation latency.",
    debug: {
      samplesPerProvider: SAMPLES_PER_PROVIDER,
      timeoutMs: TIMEOUT_MS,
      generationSeconds: elapsedSeconds,
    },
  });
}
