import { useNetworkData } from "@/hooks/useNetworkData";

export default function HeroMetric() {
  const { data } = useNetworkData();
  if (!data) return null;

  const { nqi, updatedSecondsAgo } = data;

  let contextText = "Transaction quality near baseline.";
  if (nqi >= 85) contextText = "Transaction quality above baseline.";
  if (nqi <= 70) contextText = "Transaction quality below baseline.";

  return (
    <section className="w-full flex flex-col items-center justify-center py-24 text-center">
      <div className="text-xs tracking-widest uppercase text-neutral-500 mb-4">
        Baseline Network Quality Index
      </div>

      <div className="text-7xl md:text-8xl font-semibold text-neutral-100 tabular-nums">
        {nqi.toFixed(1)}
      </div>

      <div className="mt-6 text-sm text-neutral-400">{contextText}</div>

      <div className="mt-2 text-xs text-muted-foreground/60">
        Updated {updatedSecondsAgo}s ago
      </div>
    </section>
  );
}
