import { RPCProvider } from '@/types/network';

interface RPCTableProps {
  providers: RPCProvider[];
}

export function RPCTable({ providers }: RPCTableProps) {
  const getTrendSymbol = (trend: RPCProvider['trend']) => {
    switch (trend) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '→';
    }
  };

  const getTrendClass = (trend: RPCProvider['trend']) => {
    switch (trend) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getHealthClass = (score: number) => {
    if (score >= 90) return 'text-foreground';
    if (score >= 80) return 'text-secondary-foreground';
    return 'text-warning';
  };

  return (
    <section className="py-12 border-b border-border">
      <div className="mb-6">
        <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          RPC Execution Quality
        </h2>
      </div>

      <div className="card-surface overflow-hidden">
        <table className="w-full table-terminal">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs text-muted-foreground font-medium">Provider</th>
              <th className="px-4 py-3 text-xs text-muted-foreground font-medium text-right">Health</th>
              <th className="px-4 py-3 text-xs text-muted-foreground font-medium text-right">Avg Latency</th>
              <th className="px-4 py-3 text-xs text-muted-foreground font-medium text-right">Error Rate</th>
              <th className="px-4 py-3 text-xs text-muted-foreground font-medium text-right">Trend</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((provider) => (
              <tr 
                key={provider.name} 
                className={`border-b border-border last:border-b-0 ${
                  provider.isPreferred ? 'bg-primary/5' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {provider.isPreferred && (
                      <span className="text-primary text-xs">●</span>
                    )}
                    <span className={provider.isPreferred ? 'text-primary' : 'text-foreground'}>
                      {provider.name}
                    </span>
                    {provider.isPreferred && (
                      <span className="text-xs text-muted-foreground">(Preferred Route)</span>
                    )}
                  </div>
                </td>
                <td className={`px-4 py-3 text-right ${getHealthClass(provider.healthScore)}`}>
                  {provider.healthScore}
                </td>
                <td className="px-4 py-3 text-right text-secondary-foreground">
                  {provider.avgLatency}<span className="text-muted-foreground ml-1">ms</span>
                </td>
                <td className="px-4 py-3 text-right text-secondary-foreground">
                  {provider.errorRate.toFixed(1)}<span className="text-muted-foreground ml-1">%</span>
                </td>
                <td className={`px-4 py-3 text-right ${getTrendClass(provider.trend)}`}>
                  {getTrendSymbol(provider.trend)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
