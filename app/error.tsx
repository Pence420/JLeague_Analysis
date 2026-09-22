"use client";

export default function ErrorState({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--red)]">
          Analysis interrupted
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          We couldn’t load this view.
        </h1>
        <p className="mt-4 text-[var(--ink-muted)]">
          No private error details were exposed. Try the request again.
        </p>
        <button
          className="mt-7 rounded-xl bg-[var(--ink)] px-5 py-3 font-semibold text-white"
          onClick={reset}
        >
          Try again
        </button>
      </section>
    </main>
  );
}
