import { mockNetworkData } from "@/data/mockData";

type NetworkData = typeof mockNetworkData;

export function useNetworkData(): {
  data: NetworkData | null;
  isLoading: boolean;
  error: string | null;
} {
  /**
   * Phase 1:
   * Local, deterministic data.
   * This guarantees UI stability while we finalize scoring.
   *
   * Phase 2:
   * Replace with fetch("/api/nqi")
   * without touching any components.
   */

  const data = mockNetworkData;

  return {
    data,
    isLoading: false,
    error: null,
  };
}
