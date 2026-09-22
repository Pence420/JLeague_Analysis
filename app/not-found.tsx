import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section className="max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--red)]">404 · Route not scouted</p>
        <h1 className="mt-3 text-5xl font-bold tracking-tight">This analysis doesn’t exist.</h1>
        <p className="mt-4 text-[var(--ink-muted)]">The destination may have moved, or it has not entered the current scouting scope.</p>
        <Link className="mt-7 inline-flex rounded-xl bg-[var(--ink)] px-5 py-3 font-semibold text-white" href="/">Return to League Intelligence</Link>
      </section>
    </main>
  );
}
