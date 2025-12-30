import { useNetworkData } from "@/hooks/useNetworkData";

function trendSymbol(trend: "up" | "down" | "flat") {
  if (trend === "up") return "↑";
  if (trend === "down") return "↓";
  return "→";
}

export default function RPCTable() {
  const { data } = useNetworkData();

  if (!data) return null;

  const { rpcRankings } = data;

  return (
    <section className="w-full max-w-4xl mx-auto mt-32">
      <div className="mb-6 text-xs tracking-widest uppercase text-neutral-500">
        RPC Execution Quality
      </div>

      <div className="border border-neutral-800 rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-neutral-500">
            <tr>
              <th className="px-4 py-3 text-left font-normal">
                Provider
              </th>
              <th className="px-4 py-3 text-right font-normal">
                Health
              </th>
              <th className="px-4 py-3 text-right font-normal">
                Avg Latency
              </th>
              <th className="px-4 py-3 text-right font-normal">
                Error Rate
              </th>
              <th className="px-4 py-3 text-right font-normal">
                Trend
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-800">
            {rpcRankings.map((rpc) => {
              const isPreferred = rpc.health >= 90;

              return (
                <tr
                  key={rpc.name}
                  className={
                    isPreferred
                      ? "bg-neutral-900/40"
                      : "bg-transparent"
                  }
                >
                  {/* Provider */}
                  <td className="px-4 py-3 text-neutral-200">
                    {rpc.name}
                    {isPreferred && (
                      <span className="ml-2 text-xs text-neutral-500">
                        (Preferred Route)
                      </span>
                    )}
                  </td>

                  {/* Health */}
                  <td className="px-4 py-3 text-right font-mono text-neutral-200">
                    {rpc.health}
                  </td>

                  {/* Latency */}
                  <td className="px-4 py-3 text-right font-mono text-neutral-300">
                    {rpc.latencyMs} ms
                  </td>

                  {/* Error Rate */}
                  <td className="px-4 py-3 text-right font-mono text-neutral-300">
                    {rpc.errorRate.toFixed(1)}%
                  </td>

                  {/* Trend */}
                  <td
                    className={`px-4 py-3 text-right font-mono ${
                      rpc.trend === "up"
                        ? "text-neutral-400"
                        : rpc.trend === "down"
                        ? "text-neutral-500"
                        : "text-neutral-600"
                    }`}
                  >
                    {trendSymbol(rpc.trend)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
