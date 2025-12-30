import { useNetworkData } from "@/hooks/useNetworkData";

export default function Commentary() {
  const { data } = useNetworkData();

  if (!data) return null;

  const { context } = data;

  return (
    <section className="w-full max-w-3xl mx-auto mt-32 mb-32">
      <div className="mb-6 text-xs tracking-widest uppercase text-neutral-500">
        Context
      </div>

      <div className="text-sm leading-relaxed text-neutral-300 space-y-4">
        <p>{context}</p>

        <p className="text-neutral-500">
          Baseline reflects execution conditions, not market direction.
          Metrics update continuously and should be interpreted as
          environmental context rather than signals.
        </p>
      </div>
    </section>
  );
}
