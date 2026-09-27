export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-2xl leading-none tracking-tight ${className}`}>
      Ember <span className="text-gold">&amp;</span> Aisle
    </span>
  );
}
