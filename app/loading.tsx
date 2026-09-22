export default function Loading() {
  return (
    <main
      className="mx-auto max-w-[1440px] px-5 py-8"
      aria-label="Loading League Intelligence"
    >
      <div className="h-16 animate-pulse rounded-2xl bg-black/10" />
      <div className="mt-10 grid gap-4 lg:grid-cols-12">
        {[3, 6, 3, 4, 4, 4].map((span, index) => (
          <div
            key={index}
            data-skeleton="panel"
            className="h-64 animate-pulse rounded-[var(--radius-card)] border border-[var(--line)] bg-white/70 lg:col-span-4"
            style={{ gridColumn: `span ${span}` }}
          />
        ))}
      </div>
    </main>
  );
}
