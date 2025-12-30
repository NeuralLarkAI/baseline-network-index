import { Button } from '@/components/ui/button';

export function DeveloperSection() {
  const exampleCode = `GET /v1/baseline/nqi

Response:
{
  "nqi": 78.4,
  "status": "above",
  "indicators": { ... },
  "timestamp": "2024-01-15T14:32:00Z"
}`;

  return (
    <section className="py-12">
      <div className="mb-6">
        <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Developer Access
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">
            Baseline API
          </h3>
          <p className="text-sm text-secondary-foreground leading-relaxed">
            Integrate network quality data into your applications. Route transactions 
            based on real-time execution conditions, optimize retry logic, and provide 
            users with transparent quality metrics.
          </p>
          <p className="text-sm text-secondary-foreground leading-relaxed">
            The Baseline API returns current NQI scores, quality indicators, and 
            provider health metrics. Data updates every 10 seconds with historical 
            access available for trend analysis.
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" size="sm">
              View Documentation
            </Button>
            <Button variant="ghost" size="sm">
              Request Access
            </Button>
          </div>
        </div>

        <div className="card-surface p-4">
          <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
            {exampleCode}
          </pre>
        </div>
      </div>
    </section>
  );
}
