import { NetworkData } from '@/types/network';

export const mockNetworkData: NetworkData = {
  nqi: {
    score: 78.4,
    status: 'above',
    lastUpdated: new Date().toISOString(),
  },
  indicators: [
    {
      name: 'Transaction Success Rate',
      value: 98.2,
      unit: '%',
      baseline: 97.5,
      status: 'positive',
    },
    {
      name: 'Latency Stability',
      value: 142,
      unit: 'ms σ',
      baseline: 150,
      status: 'positive',
    },
    {
      name: 'Fee Efficiency',
      value: 0.000012,
      unit: 'SOL',
      baseline: 0.000015,
      status: 'positive',
    },
    {
      name: 'Retry Pressure',
      value: 3.8,
      unit: '%',
      baseline: 2.5,
      status: 'negative',
    },
  ],
  providers: [
    {
      name: 'Helius',
      healthScore: 94,
      avgLatency: 128,
      errorRate: 0.4,
      trend: 'up',
      isPreferred: true,
    },
    {
      name: 'QuickNode',
      healthScore: 91,
      avgLatency: 142,
      errorRate: 0.6,
      trend: 'flat',
      isPreferred: false,
    },
    {
      name: 'Triton',
      healthScore: 89,
      avgLatency: 156,
      errorRate: 0.8,
      trend: 'up',
      isPreferred: false,
    },
    {
      name: 'Alchemy',
      healthScore: 87,
      avgLatency: 163,
      errorRate: 1.1,
      trend: 'down',
      isPreferred: false,
    },
    {
      name: 'GetBlock',
      healthScore: 82,
      avgLatency: 189,
      errorRate: 1.4,
      trend: 'flat',
      isPreferred: false,
    },
  ],
  commentary: [
    'Network conditions are operating above baseline. Transaction success rates remain elevated with stable confirmation times.',
    'Retry pressure has increased 1.3% over the past hour, suggesting minor congestion in leader scheduling. Monitor for escalation.',
    'Fee efficiency remains favorable. Priority fee recommendations are currently conservative relative to execution needs.',
  ],
};
