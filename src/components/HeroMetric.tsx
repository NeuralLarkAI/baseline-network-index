import { useNetworkData } from "@/hooks/useNetworkData";

export function HeroMetric() {
  const { data } = useNetworkData();

  if (!data) return null;

  const { nqi } = data;
  const score = nqi.score;

  // Context logic — calm, not reactive
  let contextText = "Transaction quality near baseline.";

  if (score >= 85) {
    contextText = "Transaction quality above baseline.";
  } else if (score <= 70) {
    contextText = "Transaction quality below baseline.";
  }

  const formattedTime = new Date(nqi.lastUpdated).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <section className="w-full flex flex-col items-center justify-center py-24 text-center">
      {/* Label */}
      <div className="text-xs tracking-widest uppercase text-muted-foreground mb-4">
        Baseline Network Quality Index
      </div>

      {/* Main Metric */}
      <div className="text-7xl md:text-8xl font-semibold text-foreground tabular-nums font-mono">
        {score.toFixed(1)}
      </div>

      {/* Context */}
      <div className="mt-6 text-sm text-muted-foreground">
        {contextText}
      </div>

      {/* Timestamp */}
      <div className="mt-2 text-xs text-muted-foreground/50">
        Updated {formattedTime} UTC
      </div>
    </section>
  );
}
