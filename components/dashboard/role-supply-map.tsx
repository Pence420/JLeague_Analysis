import type { RoleSupply } from "@/features/league-intelligence/types";

const colors = { scarce: "var(--risk)", balanced: "var(--blue)", abundant: "var(--green)" };
export function RoleSupplyMap({ items }: { items: RoleSupply[] }) {
  return <section className="surface-card p-5"><p className="eyebrow">Market structure</p><h2 className="module-title">Role Supply Map</h2><p className="mt-2 text-sm text-[var(--ink-muted)]">Eligible sample players by role—not transfer availability.</p><div className="mt-6 space-y-4">{items.map((item) => <div key={item.role}><div className="mb-1.5 flex justify-between gap-3 text-sm"><span className="font-semibold">{item.role}</span><span className="capitalize text-[var(--ink-muted)]">{item.count} · {item.status}</span></div><div className="h-2 rounded-full bg-black/5"><div className="h-full rounded-full" style={{ width: `${item.share}%`, background: colors[item.status] }} /></div></div>)}</div></section>;
}
