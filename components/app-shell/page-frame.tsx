import type { ReactNode } from "react";
import { IslandNav } from "./island-nav";

export function PageFrame({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <>
      <IslandNav />
      <main
        id="main-content"
        className="mx-auto max-w-[1480px] px-4 pb-16 pt-8 sm:px-6"
      >
        <header className="mb-7">
          <h1 className="text-3xl font-semibold tracking-[-0.035em]">
            {title}
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">{description}</p>
        </header>
        {children}
      </main>
    </>
  );
}
