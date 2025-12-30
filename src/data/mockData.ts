export const mockNetworkData = {
  nqi: 82.4,
  successRate: 96.3,
  latencyStability: "Stable",
  feeEfficiency: 0.87,
  retryPressure: "Low",
  updatedSecondsAgo: 14,
  rpcRankings: [
    {
      name: "Helius",
      health: 92,
      latencyMs: 410,
      errorRate: 0.8,
      trend: "up",
    },
    {
      name: "QuickNode",
      health: 88,
      latencyMs: 460,
      errorRate: 1.2,
      trend: "flat",
    },
    {
      name: "Public RPC",
      health: 74,
      latencyMs: 690,
      errorRate: 3.9,
      trend: "down",
    },
  ],
  context:
    "Transaction execution remains above baseline. Latency stability favors low-fee routing.",
};
