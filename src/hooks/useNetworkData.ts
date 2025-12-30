import { useEffect, useState } from "react";

type RpcRow = {
  name: string;
  health: number;
  latencyMs: number;
  errorRate: number;
  trend: "up" | "down" | "flat";
};

export type NetworkData = {
  nqi: number;
  successRate: number;
  latencyStability: string;
  feeEfficiency: number;
  retryPressure: string;
  updatedSecondsAgo: number;
  rpcRankings: RpcRow[];
  context: string;
  debug?: any;
};

export function useNetworkData() {
  const [data, setData] = useState<NetworkData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await fetch("/api/nqi-edge", { cache: "no-store" })
;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as NetworkData;

        if (mounted) {
          setData(json);
          setError(null);
          // TEMP DEBUG (remove later)
          console.log("[Baseline] /api/nqi", json);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load /api/nqi");
      }
    }

    load();
    const id = setInterval(load, 15000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return { data, error, isLoading: !data && !error };
}
