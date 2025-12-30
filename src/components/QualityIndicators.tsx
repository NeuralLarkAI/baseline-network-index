import { useNetworkData } from "@/hooks/useNetworkData";

function formatDelta(value: number) {
  if (value === 0) return "0.0";
  return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
}

export default function QualityIndicators() {
  const { data } = useNetworkData();
  if (!data) return null;

  const { successRate, latencyStability, feeEfficiency, retryPressure } = data;

  // Keep deltas subtle and quiet (hardcoded for now; later these come from real history)
  const deltas = {
    successRate: 0.4,
    latencyStability: -5.7,
    feeEfficiency: -0.0,
    retryPressure: -0.9,
  };

  return (
    <section className="w-full max-w-3xl mx-auto mt-32">
      <div className="mb-6 text-xs tracking-widest uppercase text-neutral-500">
        Quality Indicators
      </div>

      <div className="divide-y divide-neutral-800 border-t border-neutral-800">
        {/* Transaction Success Rate */}
        <div className="flex items-center justify-between py-4 text-sm">
          <div className="text-neutral-400">Transaction Success Rate</div>
          <div className="flex items-center gap-4 font-mono">
            <span className="text-neutral-500">{formatDelta(deltas.successRate)}</span>
            <span className="text-neutral-200">{successRate.toFixed(1)}%</span>
          </div>
        </div>

        {/* Latency Stability (TEXT ONLY) */}
        <div className="flex items-center justify-between py-4 text-sm">
          <div className="text-neutral-400">Latency Stability</div>
          <div className="flex items-center gap-4 font-mono">
            <span className="text-neutral-500">{formatDelta(deltas.latencyStability)}</span>
            <span className="text-neutral-200">{latencyStability}</span>
          </div>
        </div>

        {/* Fee Efficiency */}
        <div className="flex items-center justify-between py-4 text-sm">
          <div className="text-neutral-400">Fee Efficiency</div>
          <div className="flex items-center gap-4 font-mono">
            <span className="text-neutral-500">{formatDelta(deltas.feeEfficiency)}</span>
            <span className="text-neutral-200">{feeEfficiency.toFixed(6)} SOL</span>
          </div>
        </div>

        {/* Retry Pressure */}
        <div className="flex items-center justify-between py-4 text-sm">
          <div className="text-neutral-400">Retry Pressure</div>
          <div className="flex items-center gap-4 font-mono">
            <span className="text-neutral-500">{formatDelta(deltas.retryPressure)}</span>
            <span className="text-neutral-200">{retryPressure}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
