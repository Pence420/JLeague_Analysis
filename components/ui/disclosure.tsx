import type { PropsWithChildren } from "react";

export function Disclosure({ summary, children }: PropsWithChildren<{ summary: string }>) {
  return (
    <details className="group rounded-xl border border-[var(--line)] bg-[var(--surface-soft)]">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold marker:hidden">{summary}<span className="float-right transition group-open:rotate-45" aria-hidden>+</span></summary>
      <div className="border-t border-[var(--line)] px-4 py-4">{children}</div>
    </details>
  );
}
