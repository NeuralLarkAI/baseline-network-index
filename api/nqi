import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Connection } from "@solana/web3.js";

const RPC_PROVIDERS = [
  { name: "Helius", url: process.env.HELIUS_RPC!, preferred: true },
  { name: "QuickNode", url: process.env.QUICKNODE_RPC! },
  { name: "Public RPC", url: "https://api.mainnet-beta.solana.com" },
];

async function sampleRpc(name: string, url: string) {
  const start = Date.now();
  const connection = new Connection(url, "confirmed");

  try {
    const slot = await connection.getSlot();
    const latencyMs = Date.now() - start;

    return {
      name,
      ok: true,
      latencyMs,
      errorRate: 0, // placeholder (Phase 3 improves this)
      slot,
    };
  } catch (e) {
    return {
      name,
      ok: false,
      latencyMs: 999,
      errorRate: 5,
      slot: 0,
    };
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const samples = await Promise.all(
    RPC_PROVIDERS.map((p) => sampleRpc(p.name, p.url))
  );

  // --- Compute metrics ---
  const healthy = samples.filter((s) => s.ok);
  const avgLatency =
    healthy.reduce((sum, s) => sum + s.latencyMs, 0) / healthy.length;

  const successRate = (healthy.length / samples.length) * 100;

  // Simple, honest NQI formula (Phase 2)
  const nqi = Math.min(
    100,
    Math.max(
      0,
      100 -
        avgLatency / 10 -
        (100 - successRate) * 1.5
    )
  );

  const rpcRankings = samples.map((s) => ({
    name: s.name,
    health: Math.round(100 - s.latencyMs / 10),
    latencyMs: s.latencyMs,
    errorRate: s.errorRate,
    trend: "flat" as const,
  }));

  res.status(200).json({
    nqi: Number(nqi.toFixed(1)),
    successRate: Number(successRate.toFixed(1)),
    latencyStability: avgLatency < 500 ? "Stable" : "Degrading",
    feeEfficiency: 0.00002, // real fee logic comes later
    retryPressure: successRate > 95 ? "Low" : "Elevated",
    updatedSecondsAgo: 5,
    rpcRankings,
    context:
      avgLatency < 500
        ? "Transaction execution remains above baseline. Current conditions favor standard routing."
        : "Latency instability detected. Execution quality is degraded.",
  });
}
