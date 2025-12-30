export const mockNetworkData = {
  // Primary index value (0–100)
  nqi: 80.6,

  // Core quality metrics
  successRate: 95.4,
  latencyStability: "Stable",
  feeEfficiency: 0.000024, // avg SOL per tx
  retryPressure: "Low",

  // Freshness
  updatedSecondsAgo: 18,

  // RPC execution rankings
  rpcRankings: [
    {
      name: "Helius",
      health: 92,
      latencyMs: 413,
      errorRate: 1.1,
      trend: "up" as const,
    },
    {
      name: "QuickNode",
      health: 88,
      latencyMs: 454,
      errorRate: 1.1,
      trend: "flat" as const,
    },
    {
      name: "Public RPC",
      health: 74,
      latencyMs: 696,
      errorRate: 3.4,
      trend: "down" as const,
    },
  ],

  // Contextual interpretation
  context:
    "Transaction execution remains above baseline. Current conditions favor standard routing.",
};
