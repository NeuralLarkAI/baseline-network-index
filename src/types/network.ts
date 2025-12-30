export interface NetworkQualityIndex {
  score: number;
  status: 'above' | 'at' | 'below';
  lastUpdated: string;
}

export interface QualityIndicator {
  name: string;
  value: number;
  unit: string;
  baseline: number;
  status: 'positive' | 'negative' | 'neutral';
}

export interface RPCProvider {
  name: string;
  healthScore: number;
  avgLatency: number;
  errorRate: number;
  trend: 'up' | 'down' | 'flat';
  isPreferred: boolean;
}

export interface NetworkData {
  nqi: NetworkQualityIndex;
  indicators: QualityIndicator[];
  providers: RPCProvider[];
  commentary: string[];
}
