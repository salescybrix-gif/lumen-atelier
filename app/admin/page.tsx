"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, DollarSign, Percent, ShoppingCart, Users } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminShell";
import { RevenueChart, CategoryBars } from "@/components/admin/Charts";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { Skeleton } from "@/components/ui/misc";
import { api } from "@/lib/api";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import type { Order } from "@/types";

type Range = "week" | "month" | "year";
interface Stats {
  kpis: Record<"revenue" | "orders" | "activeUsers" | "conversion", { value: number; delta: number | null }>;
  series: { label: string; revenue: number; orders: number }[];
  categories: { name: string; value: number }[];
  topProducts: { title: string; image: string; units: number; revenue: number }[];
  lowStock: { id: string; title: string; size: string; units: number }[];
  recentOrders: Order[];
}

const RANGES: { id: Range; label: string }[] = [
  { id: "week", label: "7 days" },
  { id: "month", label: "30 days" },
  { id: "year", label: "12 months" },
];

export default function AdminOverview() {
  const [range, setRange] = useState<Range>("month");
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    setStats(null);
    api<Stats>(`/api/admin/stats?range=${range}`).then(setStats).catch(() => {});
  }, [range]);

  const kpis = stats
    ? [
        { label: "Total revenue", icon: DollarSign, value: formatPrice(stats.kpis.revenue.value), delta: stats.kpis.revenue.delta, unit: "%" },
        { label: "Total orders", icon: ShoppingCart, value: stats.kpis.orders.value.toLocaleString(), delta: stats.kpis.orders.delta, unit: "%" },
        { label: "Active customers", icon: Users, value: stats.kpis.activeUsers.value.toLocaleString(), delta: stats.kpis.activeUsers.delta, unit: "%" },
        { label: "Conversion rate", icon: Percent, value: `${stats.kpis.conversion.value.toFixed(2)}%`, delta: stats.kpis.conversion.delta, unit: " pts" },
      ]
    : null;

  return (
    <>
      <PageHeader
        title="Overview"
        sub={`Store performance · ${formatDate(new Date().toISOString(), { weekday: "long", month: "long", day: "numeric" })}`}
        action={
          <div className="flex rounded-full border border-line bg-surface p-1" role="tablist" aria-label="Date range">
            {RANGES.map((r) => (
              <button
                key={r.id}
                role="tab"
                aria-selected={range === r.id}
                onClick={() => setRange(r.id)}
                className={cn("rounded-full px-4 py-1.5 text-xs transition", range === r.id ? "bg-ink text-canvas" : "text-muted hover:text-ink")}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpis
          ? kpis.map(({ label, icon: Icon, value, delta, unit }) => {
              const up = (delta ?? 0) >= 0;
              return (
                <div key={label} className="card animate-fade-in p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted">{label}</p>
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-sunken">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                  </div>
                  <p className="display mt-4 text-3xl tabular-nums sm:text-4xl">{value}</p>
                  {delta === null ? (
                    <p className="mt-2 text-xs text-muted">— no prior period to compare</p>
                  ) : (
                    <p className={cn("mt-2 flex items-center gap-1 text-xs", up ? "text-success" : "text-danger")}>
                      {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                      {up ? "+" : ""}
                      {delta.toFixed(1)}
                      {unit} <span className="text-muted">vs previous period</span>
                    </p>
                  )}
                </div>
              );
            })
          : [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[150px] rounded-2xl" />)}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="card p-5 sm:p-7 xl:col-span-2">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-sm font-medium">Revenue</h2>
              <p className="text-xs text-muted">Net of refunds, {range === "year" ? "monthly" : "daily"}</p>
            </div>
            {stats && <p className="display text-2xl tabular-nums">{formatPrice(stats.kpis.revenue.value)}</p>}
          </div>
          {stats ? <RevenueChart data={stats.series} /> : <Skeleton className="h-[260px] w-full" />}
        </div>
        <div className="card p-5 sm:p-7">
          <h2 className="text-sm font-medium">Sales by category</h2>
          <p className="mb-7 text-xs text-muted">Top-selling categories this period</p>
          {stats ? <CategoryBars data={stats.categories} /> : <Skeleton className="h-[220px] w-full" />}
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="card overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between p-5 sm:px-7">
            <h2 className="text-sm font-medium">Recent orders</h2>
            <Link href="/admin/orders" className="text-xs text-muted underline-offset-4 hover:text-ink hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-y border-line bg-sunken/50 text-left text-[11px] uppercase tracking-wider text-muted">
                  <th className="px-5 py-3 font-medium sm:px-7">Order</th>
                  <th className="px-3 py-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 text-right font-medium">Total</th>
                  <th className="px-5 py-3 font-medium sm:px-7">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {stats
                  ? stats.recentOrders.map((o) => (
                      <tr key={o.id} className="transition hover:bg-sunken/40">
                        <td className="px-5 py-3.5 font-medium sm:px-7">{o.number}</td>
                        <td className="px-3 py-3.5">
                          <p>{o.customerName}</p>
                          <p className="text-xs text-muted">{o.email}</p>
                        </td>
                        <td className="px-3 py-3.5 text-muted">{formatDate(o.createdAt, { month: "short", day: "numeric" })}</td>
                        <td className="px-3 py-3.5 text-right tabular-nums">{formatPrice(o.total)}</td>
                        <td className="px-5 py-3.5 sm:px-7">
                          <StatusSelect
                            order={o}
                            onChange={(u) => setStats((s) => (s ? { ...s, recentOrders: s.recentOrders.map((x) => (x.id === u.id ? u : x)) } : s))}
                          />
                        </td>
                      </tr>
                    ))
                  : [0, 1, 2, 3, 4].map((i) => (
                      <tr key={i}>
                        <td colSpan={5} className="px-7 py-3">
                          <Skeleton className="h-8 w-full" />
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5 sm:p-7">
            <h2 className="mb-5 text-sm font-medium">Top products</h2>
            <ul className="space-y-4">
              {stats?.topProducts.map((p, i) => (
                <li key={p.title} className="flex items-center gap-3">
                  <span className="w-4 text-xs text-muted">{i + 1}</span>
                  <img src={p.image} alt="" className="h-11 w-9 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{p.title}</p>
                    <p className="text-xs text-muted">{p.units} sold</p>
                  </div>
                  <span className="text-sm tabular-nums">{formatPrice(p.revenue, { compact: true })}</span>
                </li>
              )) ?? <Skeleton className="h-48 w-full" />}
            </ul>
          </div>
          <div className="card p-5 sm:p-7">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-warning" /> Low stock
            </h2>
            <ul className="space-y-2.5 text-sm">
              {stats?.lowStock.length === 0 && <li className="text-muted">All variants well stocked.</li>}
              {stats?.lowStock.map((l) => (
                <li key={l.id + l.size} className="flex justify-between gap-3">
                  <Link href="/admin/products" className="truncate hover:underline">
                    {l.title} <span className="text-muted">· {l.size}</span>
                  </Link>
                  <span className={cn("shrink-0 tabular-nums", l.units === 0 ? "text-danger" : "text-warning")}>{l.units === 0 ? "Sold out" : `${l.units} left`}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
