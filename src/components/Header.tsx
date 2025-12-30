interface HeaderProps {
  isLive: boolean;
}

export function Header({ isLive }: HeaderProps) {
  return (
    <header className="border-b border-border">
      <div className="container max-w-4xl py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold text-foreground">
              BASELINE
            </span>
            <span className="text-muted-foreground">/</span>
            <span className="text-xs text-muted-foreground">
              Solana Network Quality Index
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`indicator-dot ${isLive ? 'bg-success animate-pulse-subtle' : 'bg-muted-foreground'}`} />
            <span className="text-xs font-mono text-muted-foreground">
              {isLive ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
