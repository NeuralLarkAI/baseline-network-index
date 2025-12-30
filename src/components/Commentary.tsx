interface CommentaryProps {
  commentary: string[];
}

export function Commentary({ commentary }: CommentaryProps) {
  return (
    <section className="py-12 border-b border-border">
      <div className="mb-6">
        <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Context
        </h2>
      </div>

      <div className="space-y-4">
        {commentary.map((text, index) => (
          <p 
            key={index} 
            className="text-sm text-secondary-foreground leading-relaxed max-w-2xl"
          >
            {text}
          </p>
        ))}
      </div>
    </section>
  );
}
