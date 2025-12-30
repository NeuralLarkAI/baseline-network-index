import { useState, useEffect, useCallback } from 'react';
import { NetworkData } from '@/types/network';
import { mockNetworkData } from '@/data/mockData';

const REFRESH_INTERVAL = 10000; // 10 seconds

// Simulates minor fluctuations in the data
function simulateDataUpdate(data: NetworkData): NetworkData {
  const fluctuate = (value: number, range: number) => {
    return value + (Math.random() - 0.5) * range;
  };

  return {
    ...data,
    nqi: {
      ...data.nqi,
      score: Math.max(0, Math.min(100, fluctuate(data.nqi.score, 2))),
      lastUpdated: new Date().toISOString(),
    },
    indicators: data.indicators.map((indicator) => ({
      ...indicator,
      value: indicator.name === 'Fee Efficiency'
        ? Math.max(0, fluctuate(indicator.value, 0.000002))
        : Math.max(0, fluctuate(indicator.value, indicator.value * 0.02)),
    })),
    providers: data.providers.map((provider) => ({
      ...provider,
      healthScore: Math.max(0, Math.min(100, Math.round(fluctuate(provider.healthScore, 1)))),
      avgLatency: Math.max(50, Math.round(fluctuate(provider.avgLatency, 10))),
      errorRate: Math.max(0, parseFloat(fluctuate(provider.errorRate, 0.2).toFixed(1))),
    })),
  };
}

export function useNetworkData() {
  const [data, setData] = useState<NetworkData>(mockNetworkData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // In production, this would be a real API call:
      // const response = await fetch('/api/v1/baseline/nqi');
      // const newData = await response.json();
      
      // For now, simulate data updates
      setData((prevData) => simulateDataUpdate(prevData));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
