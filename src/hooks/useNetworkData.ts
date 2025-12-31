import { useEffect, useRef, useState } from "react";

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

const ENDPOINT = "/api/nqi-edge";
const REFRESH_MS = 15000;
const REQUEST_TIMEOUT_MS = 6000;

export function useNetworkData() {
  const [data, setData] = useState<NetworkData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const inFlightRef = useRef(false);
  const lastUpdateRef = useRef<number | null>(null);

  // 🔁 Fetch network data
  useEffect(() => {
    let mounted = true;

    async function load() {
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      const controller = new AbortController();
      const timeoutId = window.setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS
      );

      try {
        const res = await fetch(ENDPOINT, {
          method: "GET",
          cache: "no-store",
          headers: {
            "cache-control": "no-store",
            pragma: "no-cache",
          },
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = (await res.json()) as NetworkData;

        if (mounted) {
          lastUpdateRef.current = Date.now();
          setSecondsAgo(0);

          // override updatedSecondsAgo with client-tracked value
          setData({
            ...json,
            updatedSecondsAgo: 0,
          });

          setError(null);
          console.log("[Baseline] /api/nqi-edge", json);
        }
      } catch (e: any) {
        const msg =
          e?.name === "AbortError"
            ? `Request timed out (${REQUEST_TIMEOUT_MS}ms)`
            : e?.message || `Failed to load ${ENDPOINT}`;

        if (mounted) setError(msg);
      } finally {
        window.clearTimeout(timeoutId);
        inFlightRef.current = false;
      }
    }

    load();
    const id = window.setInterval(load, REFRESH_MS);

    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  // ⏱️ Increment updatedSecondsAgo every second
  useEffect(() => {
    const tick = window.setInterval(() => {
      if (!lastUpdateRef.current) return;

      const delta = Math.floor(
        (Date.now() - lastUpdateRef.current) / 1000
      );

      setSecondsAgo(delta);

      setData((prev) =>
        prev
          ? {
              ...prev,
              updatedSecondsAgo: delta,
            }
          : prev
      );
    }, 1000);

    return () => window.clearInterval(tick);
  }, []);

  return {
    data,
    error,
    isLoading: !data && !error,
  };
}
