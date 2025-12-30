export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="container max-w-4xl py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Baseline provides neutral infrastructure quality metrics. 
            Not financial advice.
          </p>
          <div className="flex items-center gap-6 text-xs font-mono text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              Documentation
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Status
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
