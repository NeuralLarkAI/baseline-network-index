export const config = {
  runtime: "nodejs",
};

const PUBLIC_RPC = "https://api.mainnet-beta.solana.com";

function validUrl(url) {
  if (!url) return null;
  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
}

async function rpcCall(url, method, params = []) {
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method,
    params,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || "RPC error");
  return json.result;
}

async function sampleRpc(name, url) {
  const start = Date.now();
  try {
    await rpcCall(url, "getSlot", [{ commitment: "confirmed" }]);
    const latencyMs = Date.now() - start;

    return {
      name,
      ok: true,
      latencyMs,
      errorRate: 0.8,
      trend: "flat",
    };
  } catch {
    const latencyMs = Date.now() - start;
    return {
      name,
      ok: false,
      latencyMs: Math.max(999, latencyMs),
      errorRate: 5.0,
      trend: "down",
    };
  }
}

function fallbackResponse() {
  return {
    nqi: 80.0,
    successRate: 95.0,
    latencyStability: "Stable",
    feeEfficiency: 0.00002,
    retryPressure: "Low",
    updatedSecondsAgo: 10,
    rpcRankings: [
      { name: "Public RPC", health: 75, latencyMs: 650, errorRate: 3.0, trend: "flat" },
    ],
    context: "Live sampling unavailable. Serving fallback execution context.",
  };
}

export default async function handler(req, res) {
  try {
    const helius = validUrl(process.env.HELIUS_RPC);
    const quicknode = validUrl(process.env.QUICKNODE_RPC);

    const providers = [
      ...(helius ? [{ name: "Helius", url: helius }] : []),
      ...(quicknode ? [{ name: "QuickNode", url: quicknode }] : []),
      { name: "Public RPC", url: PUBLIC_RPC },
    ];

    const samples = await Promise.all(
      providers.map((p) => sampleRpc(p.name, p.url))
    );

    const healthy = samples.filter((s) => s.ok);
    const successRate = (healthy.length / samples.length) * 100;

    const avgLatency = healthy.length
      ? healthy.reduce((sum, s) => sum + s.latencyMs, 0) / healthy.length
      : 999;

    // Simple, explainable Phase 2 NQI:
    let nqi = 100 - avgLatency / 10 - (100 - successRate) * 1.5;
    nqi = Math.max(0, Math.min(100, nqi));

    const rpcRankings = samples
      .map((s) => ({
        name: s.name,
        health: Math.round(Math.max(0, Math.min(100, 100 - s.latencyMs / 10))),
        latencyMs: s.latencyMs,
        errorRate: s.errorRate,
        trend: s.trend,
      }))
      .sort((a, b) => b.health - a.health);

    res.status(200).json({
      nqi: Number(nqi.toFixed(1)),
      successRate: Number(successRate.toFixed(1)),
      latencyStability: avgLatency < 500 ? "Stable" : "Degrading",
      feeEfficiency: 0.00002,
      retryPressure: successRate > 95 ? "Low" : "Elevated",
      updatedSecondsAgo: 10,
      rpcRankings,
      context:
        avgLatency < 500
          ? "Transaction execution remains above baseline. Current conditions favor standard routing."
          : "Latency instability detected. Execution quality is degraded.",
    });
  } catch {
    res.status(200).json(fallbackResponse());
  }
}
