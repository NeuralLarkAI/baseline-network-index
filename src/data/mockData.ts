import { NetworkData } from '@/types/network';

export const mockNetworkData: NetworkData = {
  nqi: {
    score: 82.4,
    status: 'above',
    lastUpdated: new Date().toISOString(),
  },
  indicators: [
    {
      name: 'Transaction Success Rate',
      value: 96.3,
      unit: '%',
      baseline: 95.0,
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
      value: 0.000023,
      unit: 'SOL',
      baseline: 0.000025,
      status: 'positive',
    },
    {
      name: 'Retry Pressure',
      value: 2.1,
      unit: '%',
      baseline: 3.0,
      status: 'positive',
    },
  ],
  providers: [
    {
      name: 'Helius',
      healthScore: 92,
      avgLatency: 410,
      errorRate: 0.8,
      trend: 'up',
      isPreferred: true,
    },
    {
      name: 'QuickNode',
      healthScore: 88,
      avgLatency: 460,
      errorRate: 1.2,
      trend: 'flat',
      isPreferred: false,
    },
    {
      name: 'Public RPC',
      healthScore: 74,
      avgLatency: 690,
      errorRate: 3.9,
      trend: 'down',
      isPreferred: false,
    },
  ],
  commentary: [
    'Transaction execution remains above baseline. Current conditions favor standard routing.',
    'Latency stability indicates consistent block propagation across major providers.',
    'Fee efficiency trending positive — low priority transactions executing within expected ranges.',
  ],
};
