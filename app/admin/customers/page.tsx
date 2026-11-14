"use client";
import { useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminShell";
import { Badge, EmptyState, Skeleton, StatusBadge } from "@/components/ui/misc";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { toast } from "@/lib/store/ui";
import { cn, formatDate, formatPrice, initials } from "@/lib/utils";
import type { Order, PublicUser } from "@/types";

type Customer = PublicUser & { orderCount: number; lifetimeSpend: number; lastOrderAt: string | null };

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [sort, setSort] = useState<"spend" | "orders" | "recent">("spend");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [detail, setDetail] = useState<Order[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ customers: Customer[] }>("/api/admin/customers").then((d) => setCustomers(d.customers));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setDetail(null);
    api<{ orders: Order[] }>(`/api/admin/customers/${selected.id}`).then((d) => setDetail(d.orders));
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = useMemo(() => {
    if (!customers) return null;
    const s = q.toLowerCase();
    return customers
      .filter((c) => (filter === "all" || (filter === "active" ? c.active : !c.active)) && (!s || `${c.name} ${c.email}`.toLowerCase().includes(s)))
      .sort((a, b) => (sort === "spend" ? b.lifetimeSpend - a.lifetimeSpend : sort === "orders" ? b.orderCount - a.orderCount : +new Date(b.createdAt) - +new Date(a.createdAt)));
  }, [customers, q, filter, sort]);

  const toggleActive = async (c: Customer) => {
    setBusy(true);
    try {
      const { customer } = await api<{ customer: PublicUser }>(`/api/admin/customers/${c.id}`, { method: "PATCH", body: { active: !c.active } });
      const merged = { ...c, ...customer };
      setCustomers((cs) => cs?.map((x) => (x.id === c.id ? merged : x)) ?? null);
      setSelected(merged);
      toast({ title: customer.active ? "Account reactivated" : "Account deactivated", description: c.email, tone: customer.active ? "success" : "default" });
    } catch (err) {
      toast({ title: (err as Error).message, tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const totalSpend = customers?.reduce((s, c) => s + c.lifetimeSpend, 0) ?? 0;

  return (
    <>
      <PageHeader
        title="Customers"
        sub={customers ? `${customers.length} registered · ${formatPrice(totalSpend, { compact: true })} lifetime revenue` : "Loading…"}
      />

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <div className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-full border border-line bg-canvas px-4 focus-within:border-ink/50">
            <Search className="h-4 w-4 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" className="w-full bg-transparent text-sm focus:outline-none" />
          </div>
          <div className="flex rounded-full border border-line bg-canvas p-1">
            {(["all", "active", "inactive"] as const).map((s) => (
              <button key={s} onClick={() => setFilter(s)} className={cn("rounded-full px-3.5 py-1 text-xs capitalize transition", filter === s ? "bg-ink text-canvas" : "text-muted hover:text-ink")}>
                {s}
              </button>
            ))}
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-10 rounded-full border border-line bg-canvas px-4 text-sm focus:outline-none" aria-label="Sort customers">
            <option value="spend">Highest spend</option>
            <option value="orders">Most orders</option>
            <option value="recent">Newest</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line bg-sunken/50 text-left text-[11px] uppercase tracking-wider text-muted">
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-3 py-3 font-medium">Registered</th>
                <th className="px-3 py-3 text-right font-medium">Orders</th>
                <th className="px-3 py-3 text-right font-medium">Lifetime spend</th>
                <th className="px-3 py-3 font-medium">Last order</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {!list
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-5 py-3"><Skeleton className="h-10 w-full" /></td>
                    </tr>
                  ))
                : list.map((c) => (
                    <tr key={c.id} onClick={() => setSelected(c)} className={cn("cursor-pointer transition hover:bg-sunken/40", !c.active && "opacity-60")}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sunken text-xs font-medium">{initials(c.name)}</span>
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 truncate font-medium">
                              {c.name} {c.role === "admin" && <ShieldCheck className="h-3.5 w-3.5 text-accent" aria-label="Admin" />}
                            </p>
                            <p className="truncate text-xs text-muted">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted">{formatDate(c.createdAt)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{c.orderCount}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatPrice(c.lifetimeSpend)}</td>
                      <td className="px-3 py-3 text-muted">{c.lastOrderAt ? formatDate(c.lastOrderAt) : "—"}</td>
                      <td className="px-5 py-3">{c.active ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Deactivated</Badge>}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {list && list.length === 0 && <EmptyState title="No customers found" />}
        </div>
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        size="lg"
        title={selected?.name}
        description={selected ? `${selected.email} · Customer since ${formatDate(selected.createdAt, { month: "long", year: "numeric" })}` : ""}
        footer={
          selected && selected.role !== "admin" ? (
            <Button variant={selected.active ? "danger" : "primary"} loading={busy} onClick={() => toggleActive(selected)}>
              {selected.active ? "Deactivate account" : "Reactivate account"}
            </Button>
          ) : undefined
        }
      >
        {selected && (
          <div className="space-y-8 p-6 sm:p-8">
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Orders", String(selected.orderCount)],
                ["Lifetime spend", formatPrice(selected.lifetimeSpend)],
                ["Avg. order", selected.orderCount ? formatPrice(Math.round(selected.lifetimeSpend / selected.orderCount)) : "—"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-sunken/60 p-4">
                  <p className="text-xs text-muted">{k}</p>
                  <p className="display mt-1 text-2xl tabular-nums">{v}</p>
                </div>
              ))}
            </div>
            {!selected.active && <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">This account is deactivated. The customer can't sign in or place orders while signed in.</p>}
            <div>
              <p className="eyebrow mb-3">Saved addresses</p>
              {selected.addresses.length ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {selected.addresses.map((a) => (
                    <li key={a.id} className="rounded-2xl border border-line p-4 text-sm">
                      <p className="font-medium">{a.label}</p>
                      <p className="text-muted">{a.line1}, {a.city} {a.region}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">None saved.</p>
              )}
            </div>
            <div>
              <p className="eyebrow mb-3">Order history</p>
              {!detail ? (
                <Skeleton className="h-32 w-full" />
              ) : detail.length === 0 ? (
                <p className="text-sm text-muted">No orders yet.</p>
              ) : (
                <ul className="divide-y divide-line rounded-2xl border border-line">
                  {detail.map((o) => (
                    <li key={o.id} className="flex items-center gap-4 px-4 py-3 text-sm">
                      <span className="w-28 font-medium">{o.number}</span>
                      <span className="flex-1 text-muted">{formatDate(o.createdAt)}</span>
                      <StatusBadge status={o.status} />
                      <span className="w-24 text-right tabular-nums">{formatPrice(o.total)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
