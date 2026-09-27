export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-4">
      <div className="h-9 w-56 animate-pulse rounded-lg bg-line/70" />
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-line/50" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-line/40" />
    </div>
  );
}
