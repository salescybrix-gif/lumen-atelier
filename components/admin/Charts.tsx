"use client";
import { useMemo, useRef, useState } from "react";
import { formatPrice } from "@/lib/utils";

/**
 * Lightweight SVG charts (no chart library).
 * Single-series, so no legend: the card title names the series.
 * Thin 2px line, recessive grid, crosshair + tooltip on hover.
 */
export function RevenueChart({ data }: { data: { label: string; revenue: number; orders: number }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const W = 800;
  const H = 280;
  const pad = { t: 16, r: 12, b: 28, l: 56 };
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const nice = niceMax(max);
  const x = (i: number) => pad.l + (data.length <= 1 ? 0 : (i / (data.length - 1)) * (W - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - v / nice) * (H - pad.t - pad.b);

  const { line, area } = useMemo(() => {
    const pts = data.map((d, i) => [x(i), y(d.revenue)] as const);
    const line = pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`).join(" ");
    const area = `${line} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
    return { line, area };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, nice]);

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * nice);
  const labelEvery = Math.ceil(data.length / 7);

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };

  const h = hover != null ? data[hover] : null;
  return (
    <div ref={ref} className="relative" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Revenue over time">
        <defs>
          <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgb(var(--ink))" stopOpacity="0.14" />
            <stop offset="1" stopColor="rgb(var(--ink))" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="rgb(var(--line))" strokeDasharray={t ? "3 4" : undefined} vectorEffect="non-scaling-stroke" />
            <text x={pad.l - 10} y={y(t) + 4} textAnchor="end" fontSize="11" fill="rgb(var(--muted))">
              {formatPrice(t, { compact: true })}
            </text>
          </g>
        ))}
        {data.map((d, i) =>
          i % labelEvery === 0 || i === data.length - 1 ? (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="rgb(var(--muted))">
              {d.label}
            </text>
          ) : null
        )}
        <path d={area} fill="url(#rev-fill)" />
        <path d={line} fill="none" stroke="rgb(var(--ink))" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {hover != null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="rgb(var(--muted))" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>
      {h && hover != null && (
        <>
          <span
            className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-ink"
            style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(h.revenue) / H) * 100}%` }}
          />
          <div
            className="glass pointer-events-none absolute top-2 z-10 min-w-[150px] rounded-xl border border-line px-3 py-2 text-xs shadow-soft"
            style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${hover > data.length / 2 ? "calc(-100% - 12px)" : "12px"})` }}
          >
            <p className="text-muted">{h.label}</p>
            <p className="mt-1 text-sm font-medium tabular-nums">{formatPrice(h.revenue)}</p>
            <p className="text-muted">{h.orders} orders</p>
          </div>
        </>
      )}
    </div>
  );
}

/** Horizontal magnitude bars — one hue, sorted descending, direct value labels. */
export function CategoryBars({ data }: { data: { name: string; value: number }[] }) {
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ul className="space-y-4">
      {data.map((d) => (
        <li key={d.name} onMouseEnter={() => setHover(d.name)} onMouseLeave={() => setHover(null)} className="group relative">
          <div className="mb-1.5 flex justify-between text-xs">
            <span>{d.name}</span>
            <span className="tabular-nums text-muted">{formatPrice(d.value, { compact: true })}</span>
          </div>
          <div className="h-2 rounded-full bg-sunken">
            <div className="h-full rounded-r-[4px] rounded-l-full bg-ink transition-all duration-700 group-hover:bg-accent" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          {hover === d.name && (
            <div className="glass pointer-events-none absolute -top-9 right-0 z-10 rounded-lg border border-line px-2.5 py-1.5 text-[11px] shadow-soft">
              {formatPrice(d.value)} · {total ? Math.round((d.value / total) * 100) : 0}% of sales
            </div>
          )}
        </li>
      ))}
      {data.length === 0 && <p className="text-sm text-muted">No sales in this period.</p>}
    </ul>
  );
}

function niceMax(v: number) {
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / exp;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * exp;
}
