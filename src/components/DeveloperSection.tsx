import { useNetworkData } from "@/hooks/useNetworkData";

export default function DeveloperSection() {
  const { data } = useNetworkData();
  if (!data) return null;

  return (
    <section className="w-full max-w-5xl mx-auto mt-32 mb-32">
      <div className="mb-6 text-xs tracking-widest uppercase text-neutral-500">
        Developer Access
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-neutral-800 pt-8">
        <div>
          <div className="text-lg text-neutral-100 mb-3">Baseline API</div>

          <p className="text-sm leading-relaxed text-neutral-400">
            Integrate network quality context into your applications. Route transactions
            based on real-time execution conditions and provide users with transparent
            quality metrics.
          </p>

          <p className="text-sm leading-relaxed text-neutral-500 mt-4">
            The Baseline API returns current NQI scores, indicator states, and provider
            health metrics. Data updates continuously.
          </p>

          <div className="mt-6 flex gap-3">
            <button className="px-4 py-2 text-xs border border-neutral-700 text-neutral-200 hover:border-neutral-500 transition">
              View Documentation
            </button>
            <button className="px-4 py-2 text-xs border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700 transition">
              Request Access
            </button>
          </div>
        </div>

        <div className="border border-neutral-800 bg-neutral-950/40 p-4 font-mono text-xs text-neutral-300 overflow-auto">
          <div className="text-neutral-500 mb-3">GET /v1/baseline/nqi</div>
          <pre className="whitespace-pre-wrap leading-relaxed">
{`{
  "nqi": 79.1,
  "status": "near_baseline",
  "indicators": {
    "successRate": 95.4,
    "latencyStability": "Stable",
    "feeEfficiency": 0.000024,
    "retryPressure": "Low"
  },
  "timestamp": "2025-12-30T02:46:36Z"
}`}
          </pre>
        </div>
      </div>
    </section>
  );
}
