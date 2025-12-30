export const mockNetworkData = {
  nqi: 84.0,

  successRate: 95.6,
  latencyStability: "Stable",
  feeEfficiency: 0.000023, // avg SOL per tx
  retryPressure: "Low",

  updatedSecondsAgo: 18,

  rpcRankings: [
    {
      name: "Helius",
      health: 92,
      latencyMs: 402,
      errorRate: 0.8,
      trend: "up" as const,
    },
    {
      name: "QuickNode",
      health: 88,
      latencyMs: 465,
      errorRate: 1.2,
      trend: "flat" as const,
    },
    {
      name: "Public RPC",
      health: 74,
      latencyMs: 689,
      errorRate: 3.9,
      trend: "down" as const,
    },
  ],

  context:
    "Transaction execution remains above baseline. Current conditions favor standard routing.",
};
