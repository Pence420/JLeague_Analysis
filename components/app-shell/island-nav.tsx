"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const destinations = [
  { href: "/", label: "League" },
  { href: "/teams", label: "Teams" },
  { href: "/players", label: "Players" },
  { href: "/moneyball", label: "Moneyball" },
  { href: "/compare", label: "Compare" },
  { href: "/methodology", label: "Methodology" },
];

export function IslandNav({ activeHref }: { activeHref?: string }) {
  const pathname = usePathname();
  const active = activeHref ?? pathname;
  const [open, setOpen] = useState(false);
  const isActive = (href: string) =>
    href === "/" ? active === "/" : active.startsWith(href);

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 rounded-xl border border-[var(--line)] bg-white/95 px-4 py-2.5 shadow-[var(--shadow-nav)] backdrop-blur sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="J-Scout home"
        >
          <Image
            src="/brand/j-scout-mark.svg"
            alt=""
            width={28}
            height={28}
            priority
          />
          <strong className="text-[15px] tracking-[0.08em]">J-SCOUT</strong>
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {destinations.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`rounded-lg px-3.5 py-2 text-sm transition ${isActive(item.href) ? "bg-[var(--nav)] text-white" : "text-[var(--ink-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Menu"
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="grid size-9 place-items-center rounded-lg border border-[var(--line)] text-lg md:hidden"
        >
          {open ? "×" : "≡"}
        </button>
        <span className="hidden size-9 place-items-center rounded-lg bg-[var(--surface-soft)] text-xs font-semibold md:grid">
          JS
        </span>
      </div>
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile primary"
          className="mx-auto mt-2 grid max-w-[1480px] grid-cols-2 gap-1 rounded-xl border border-[var(--line)] bg-white p-2 md:hidden"
        >
          {destinations.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`rounded-lg px-3 py-2 text-sm ${isActive(item.href) ? "bg-[var(--nav)] text-white" : "text-[var(--ink-muted)]"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
