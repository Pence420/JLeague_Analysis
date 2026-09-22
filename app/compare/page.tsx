import { Suspense } from "react";
import { CompareWorkbench } from "@/components/compare/compare-workbench";

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center text-sm text-[var(--ink-muted)]">
          Preparing comparison…
        </div>
      }
    >
      <CompareWorkbench />
    </Suspense>
  );
}
