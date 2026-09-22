"use client";

import { BarChart3, Menu, Search, ShieldCheck, Users, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const destinations = [
  { href: "/", label: "League" },
  { href: "/teams", label: "Teams" },
  { href: "/players", label: "Players" },
  { href: "/moneyball", label: "Moneyball" },
  { href: "/compare", label: "Compare" },
  { href: "/methodology", label: "Methodology" },
];

export function IslandNav({ activeHref = "/" }: { activeHref?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="mx-auto flex max-w-[1440px] items-center justify-between gap-5 px-5 pt-5 sm:px-7">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="J-Scout home">
          <Image src="/brand/j-scout-mark.svg" alt="" width={42} height={42} priority />
          <span><strong className="block text-lg leading-none tracking-tight">J-SCOUT</strong><small className="mt-1 block text-[9px] font-bold tracking-[0.16em] text-[var(--ink-muted)]">JAPAN FOOTBALL INTELLIGENCE</small></span>
        </Link>
        <nav aria-label="Primary" className="hidden items-center rounded-[1.6rem] bg-[var(--nav)] p-1.5 text-sm font-semibold text-white shadow-[var(--shadow-nav)] md:flex">
          {destinations.map((item) => (
            <Link key={item.href} href={item.href} aria-current={activeHref === item.href ? "page" : undefined} className={`relative rounded-[1.2rem] px-4 py-3 text-white/70 transition hover:text-white ${activeHref === item.href ? "bg-white/10 text-white after:absolute after:inset-x-4 after:-bottom-0.5 after:h-0.5 after:bg-[var(--red)]" : ""}`}>{item.label}</Link>
          ))}
        </nav>
        <button type="button" className="hidden size-11 place-items-center rounded-full border border-[var(--line)] bg-white md:grid" aria-label="Search dashboard"><Search size={18} /></button>
      </header>

      <nav aria-label="Primary mobile" className="fixed inset-x-3 bottom-3 z-50 flex items-center justify-around rounded-[1.65rem] bg-[var(--nav)] p-2 text-white shadow-[var(--shadow-nav)] md:hidden">
        <Link href="/" aria-current={activeHref === "/" ? "page" : undefined} className="grid min-h-12 min-w-14 place-items-center rounded-2xl text-[11px]"><BarChart3 size={19} /><span>League</span></Link>
        <Link href="/players" className="grid min-h-12 min-w-14 place-items-center rounded-2xl text-[11px]"><Users size={19} /><span>Players</span></Link>
        <Link href="/moneyball" className="grid min-h-12 min-w-14 place-items-center rounded-2xl text-[11px]"><ShieldCheck size={19} /><span>Moneyball</span></Link>
        <button type="button" aria-expanded={open} aria-controls="mobile-destinations" onClick={() => setOpen((value) => !value)} className="grid min-h-12 min-w-14 place-items-center rounded-2xl text-[11px]">{open ? <X size={19} /> : <Menu size={19} />}<span>More</span></button>
      </nav>
      {open && (
        <div id="mobile-destinations" role="menu" aria-label="More destinations" className="fixed inset-x-4 bottom-24 z-40 rounded-3xl border border-white/10 bg-[var(--nav)] p-3 text-white shadow-[var(--shadow-nav)] md:hidden">
          {destinations.slice(1).map((item) => <Link key={item.href} role="menuitem" href={item.href} className="block rounded-xl px-4 py-3 hover:bg-white/10" onClick={() => setOpen(false)}>{item.label}</Link>)}
        </div>
      )}
    </>
  );
}
