"use client";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminShell";
import { OrderDetail } from "@/components/admin/OrderDetail";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { ORDER_STATUSES, type Order, type OrderStatus } from "@/types";

const PAGE = 15;

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    api<{ orders: Order[] }>("/api/admin/orders").then((d) => setOrders(d.orders));
  }, []);
  useEffect(() => setPage(0), [q, status]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders?.length ?? 0 };
    orders?.forEach((o) => (c[o.status] = (c[o.status] ?? 0) + 1));
    return c;
  }, [orders]);

  const list = useMemo(() => {
    if (!orders) return null;
    const s = q.toLowerCase();
    return orders.filter(
      (o) => (status === "all" || o.status === status) && (!s || `${o.number} ${o.customerName} ${o.email} ${o.trackingNumber}`.toLowerCase().includes(s))
    );
  }, [orders, q, status]);

  const update = (u: Order) => setOrders((os) => os?.map((o) => (o.id === u.id ? u : o)) ?? null);
  const pageItems = list?.slice(page * PAGE, page * PAGE + PAGE);
  const pages = list ? Math.max(1, Math.ceil(list.length / PAGE)) : 1;

  return (
    <>
      <PageHeader title="Orders" sub="Fulfil, track and refund customer orders." />

      <div className="scrollbar-none mb-4 flex gap-2 overflow-x-auto">
        {(["all", ...ORDER_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={cn("flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs capitalize transition", status === s ? "border-ink bg-ink text-canvas" : "border-line bg-surface hover:border-ink/40")}
          >
            {s} <span className={cn("tabular-nums", status === s ? "text-canvas/70" : "text-muted")}>{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-line p-4">
          <div className="flex h-10 max-w-md items-center gap-2 rounded-full border border-line bg-canvas px-4 focus-within:border-ink/50">
            <Search className="h-4 w-4 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order #, customer, email or tracking" className="w-full bg-transparent text-sm focus:outline-none" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-line bg-sunken/50 text-left text-[11px] uppercase tracking-wider text-muted">
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-3 py-3 font-medium">Customer</th>
                <th className="px-3 py-3 font-medium">Items</th>
                <th className="px-3 py-3 font-medium">Date</th>
                <th className="px-3 py-3 text-right font-medium">Total</th>
                <th className="px-3 py-3 font-medium">Fulfilment</th>
                <th className="px-5 py-3 font-medium">Tracking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {!pageItems
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-5 py-3"><Skeleton className="h-10 w-full" /></td>
                    </tr>
                  ))
                : pageItems.map((o) => (
                    <tr key={o.id} onClick={() => setSelected(o.id)} className="cursor-pointer transition hover:bg-sunken/40">
                      <td className="px-5 py-3.5 font-medium">{o.number}</td>
                      <td className="px-3 py-3.5">
                        <p>{o.customerName}</p>
                        <p className="text-xs text-muted">{o.email}</p>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {o.items.slice(0, 3).map((i, k) => (
                              <img key={k} src={i.image} alt="" className="h-9 w-7 rounded border-2 border-surface object-cover" />
                            ))}
                          </div>
                          <span className="text-xs text-muted">{o.items.reduce((n, i) => n + i.qty, 0)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-muted">{formatDate(o.createdAt)}</td>
                      <td className="px-3 py-3.5 text-right tabular-nums">
                        {formatPrice(o.total)}
                        {o.refunded > 0 && <p className="text-xs text-danger">−{formatPrice(o.refunded)}</p>}
                      </td>
                      <td className="px-3 py-3.5"><StatusSelect order={o} onChange={update} /></td>
                      <td className="px-5 py-3.5 font-mono text-xs text-muted">{o.trackingNumber ? `${o.carrier} ${o.trackingNumber}` : "—"}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {list && list.length === 0 && <EmptyState title="No orders found" body="Try a different search or status." />}
        </div>
        {list && list.length > PAGE && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-xs text-muted">
            <span>
              {page * PAGE + 1}–{Math.min(list.length, (page + 1) * PAGE)} of {list.length}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button size="sm" variant="outline" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      <OrderDetail order={orders?.find((o) => o.id === selected) ?? null} onClose={() => setSelected(null)} onChange={update} />
    </>
  );
}
