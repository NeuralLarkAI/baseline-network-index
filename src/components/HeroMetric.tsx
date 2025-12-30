import { NetworkQualityIndex } from '@/types/network';

interface HeroMetricProps {
  nqi: NetworkQualityIndex;
}

const statusText = {
  above: 'Conditions above baseline',
  at: 'Conditions at baseline',
  below: 'Conditions below baseline',
};

const statusColor = {
  above: 'text-success',
  at: 'text-muted-foreground',
  below: 'text-warning',
};

export function HeroMetric({ nqi }: HeroMetricProps) {
  const formattedTime = new Date(nqi.lastUpdated).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <section className="text-center py-16 border-b border-border">
      <div className="space-y-1 mb-8">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Network Quality Index
        </p>
        <h1 className="text-sm font-medium text-foreground/70">BASELINE NQI</h1>
      </div>

      <div className="space-y-4">
        <p className="font-mono text-8xl md:text-9xl font-semibold tracking-tighter text-foreground">
          {nqi.score.toFixed(1)}
        </p>
        
        <div className="space-y-2">
          <p className={`text-sm font-medium ${statusColor[nqi.status]}`}>
            {statusText[nqi.status]}
          </p>
          <p className="text-xs font-mono text-muted-foreground">
            Last updated {formattedTime} UTC
          </p>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <div className="flex items-center gap-6 text-xs font-mono text-muted-foreground">
          <span>0</span>
          <div className="w-48 h-px bg-border relative">
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-1 h-3 bg-primary"
              style={{ left: `${nqi.score}%` }}
            />
          </div>
          <span>100</span>
        </div>
      </div>
    </section>
  );
}
