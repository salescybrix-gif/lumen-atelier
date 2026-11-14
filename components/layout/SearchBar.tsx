"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Search, X } from "lucide-react";
import { useDebounced } from "@/lib/hooks";
import { cn, formatPrice } from "@/lib/utils";
import type { ProductSummary } from "@/types";

const SUGGESTED = ["Cashmere", "Leather tote", "Fragrance", "Overcoat", "Gift"];

export function SearchBar({ className, autoFocus, onNavigate }: { className?: string; autoFocus?: boolean; onNavigate?: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [active, setActive] = useState(-1);
  const debounced = useDebounced(q.trim(), 180);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!debounced) {
      setResults([]);
      setTotal(0);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    fetch(`/api/products?q=${encodeURIComponent(debounced)}&limit=6&sort=popular`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        setResults(d.items);
        setTotal(d.total);
        setActive(-1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [debounced]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    onNavigate?.();
    router.push(href);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && results[active]) go(`/product/${results[active].slug}`);
      else if (q.trim()) go(`/shop?q=${encodeURIComponent(q.trim())}`);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrap} className={cn("relative", className)}>
      <div className="flex h-10 items-center gap-2 rounded-full border border-line bg-surface/70 px-4 transition focus-within:border-ink/50 focus-within:bg-surface">
        <Search className="h-4 w-4 shrink-0 text-muted" />
        <input
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder="Search the collection"
          aria-label="Search products"
          role="combobox"
          aria-expanded={open}
          aria-controls="search-results"
          className="w-full bg-transparent text-sm placeholder:text-muted/80 focus:outline-none"
        />
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted" />
        ) : q ? (
          <button onClick={() => setQ("")} aria-label="Clear search" className="text-muted hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {open && (
        <div
          id="search-results"
          role="listbox"
          className="glass absolute left-0 right-0 top-12 z-50 min-w-[320px] animate-scale-in overflow-hidden rounded-2xl border border-line shadow-lift"
        >
          {!debounced ? (
            <div className="p-5">
              <p className="eyebrow mb-3">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED.map((s) => (
                  <button key={s} onClick={() => setQ(s)} className="rounded-full border border-line px-3 py-1.5 text-xs transition hover:border-ink/50">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 && !loading ? (
            <p className="p-5 text-sm text-muted">No results for “{debounced}”.</p>
          ) : (
            <>
              <ul className="max-h-[60vh] overflow-y-auto p-2">
                {results.map((p, i) => (
                  <li key={p.id} role="option" aria-selected={i === active}>
                    <Link
                      href={`/product/${p.slug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        go(`/product/${p.slug}`);
                      }}
                      onMouseEnter={() => setActive(i)}
                      className={cn("flex items-center gap-3 rounded-xl p-2 transition", i === active && "bg-sunken")}
                    >
                      <img src={p.images[0]} alt="" className="h-14 w-11 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{p.title}</p>
                        <p className="truncate text-xs text-muted">{p.category}</p>
                      </div>
                      <span className="text-sm tabular-nums">{formatPrice(p.price)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => go(`/shop?q=${encodeURIComponent(debounced)}`)}
                className="flex w-full items-center justify-between border-t border-line px-5 py-3 text-xs font-medium transition hover:bg-sunken"
              >
                View all {total} results <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
