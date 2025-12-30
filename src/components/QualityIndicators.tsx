import { QualityIndicator } from '@/types/network';

interface QualityIndicatorsProps {
  indicators: QualityIndicator[];
}

export function QualityIndicators({ indicators }: QualityIndicatorsProps) {
  const formatValue = (value: number, unit: string) => {
    if (unit === 'SOL') {
      return value.toFixed(6);
    }
    if (unit === '%' || unit === 'ms σ') {
      return value.toFixed(1);
    }
    return value.toString();
  };

  const getStatusClass = (status: QualityIndicator['status']) => {
    switch (status) {
      case 'positive':
        return 'text-foreground';
      case 'negative':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  const getDeltaText = (value: number, baseline: number, unit: string) => {
    const delta = value - baseline;
    const sign = delta >= 0 ? '+' : '';
    
    if (unit === 'SOL') {
      return `${sign}${delta.toFixed(6)}`;
    }
    if (unit === '%' || unit === 'ms σ') {
      return `${sign}${delta.toFixed(1)}`;
    }
    return `${sign}${delta}`;
  };

  return (
    <section className="py-12 border-b border-border">
      <div className="mb-6">
        <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Quality Indicators
        </h2>
      </div>

      <div className="space-y-0">
        {indicators.map((indicator) => (
          <div key={indicator.name} className="data-row">
            <span className="text-sm text-secondary-foreground">
              {indicator.name}
            </span>
            
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-muted-foreground">
                Δ {getDeltaText(indicator.value, indicator.baseline, indicator.unit)}
              </span>
              <span className={`font-mono text-sm ${getStatusClass(indicator.status)}`}>
                {formatValue(indicator.value, indicator.unit)}
                <span className="text-muted-foreground ml-1">{indicator.unit}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
