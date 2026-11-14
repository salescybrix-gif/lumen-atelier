"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard, ProductCardSkeleton } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Input";
import { EmptyState, Stars } from "@/components/ui/misc";
import { useEscape, useScrollLock } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { CATEGORIES, type ProductSummary } from "@/types";

interface Facets {
  colors: { name: string; hex: string }[];
  sizes: string[];
  minPrice: number;
  maxPrice: number;
}

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most popular" },
  { value: "price-asc", label: "Price: Low to high" },
  { value: "price-desc", label: "Price: High to low" },
  { value: "rating", label: "Top rated" },
];

export function ShopView() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [items, setItems] = useState<ProductSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [drawer, setDrawer] = useState(false);
  useScrollLock(drawer);
  useEscape(() => setDrawer(false), drawer);

  const getList = useCallback((k: string) => (sp.get(k) ? sp.get(k)!.split(",").filter(Boolean) : []), [sp]);
  const categories = getList("category");
  const sizes = getList("sizes");
  const colors = getList("colors");
  const q = sp.get("q") ?? "";
  const sort = sp.get("sort") ?? "newest";
  const rating = Number(sp.get("rating") ?? 0);
  const [min, setMin] = useState(sp.get("min") ?? "");
  const [max, setMax] = useState(sp.get("max") ?? "");

  useEffect(() => {
    setMin(sp.get("min") ?? "");
    setMax(sp.get("max") ?? "");
  }, [sp]);

  useEffect(() => {
    const ctrl = new AbortController();
    setItems(null);
    const params = new URLSearchParams(sp.toString());
    params.set("facets", "1");
    fetch(`/api/products?${params}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items);
        setTotal(d.total);
        setFacets(d.facets);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [sp]);

  const update = (patch: Record<string, string | string[] | null>) => {
    const params = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => {
      const val = Array.isArray(v) ? v.join(",") : v;
      if (val) params.set(k, val);
      else params.delete(k);
    });
    router.replace(`${pathname}?${params}`, { scroll: false });
  };
  const toggleIn = (key: string, list: string[], value: string) =>
    update({ [key]: list.includes(value) ? list.filter((x) => x !== value) : [...list, value] });

  const chips = useMemo(() => {
    const c: { label: string; clear: () => void }[] = [];
    if (q) c.push({ label: `“${q}”`, clear: () => update({ q: null }) });
    categories.forEach((x) => c.push({ label: x, clear: () => toggleIn("category", categories, x) }));
    sizes.forEach((x) => c.push({ label: `Size ${x}`, clear: () => toggleIn("sizes", sizes, x) }));
    colors.forEach((x) => c.push({ label: x, clear: () => toggleIn("colors", colors, x) }));
    if (rating) c.push({ label: `${rating}★ & up`, clear: () => update({ rating: null }) });
    if (sp.get("min") || sp.get("max")) c.push({ label: `₹${Number(sp.get("min") || 0).toLocaleString("en-IN")} – ${sp.get("max") ? "₹" + Number(sp.get("max")).toLocaleString("en-IN") : "∞"}`, clear: () => update({ min: null, max: null }) });
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  const title = q ? `Results for “${q}”` : categories.length === 1 ? categories[0] : "The Collection";

  const filters = (
    <div className="space-y-9">
      <FilterGroup title="Category">
        <div className="space-y-3">
          {CATEGORIES.map((c) => (
            <Checkbox key={c} label={c} checked={categories.includes(c)} onChange={() => toggleIn("category", categories, c)} />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Price">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            update({ min: min || null, max: max || null });
          }}
        >
          <PriceInput value={min} onChange={setMin} placeholder={facets ? String(facets.minPrice) : "Min"} />
          <span className="text-muted">–</span>
          <PriceInput value={max} onChange={setMax} placeholder={facets ? String(facets.maxPrice) : "Max"} />
          <Button size="sm" variant="outline" type="submit" className="h-10">
            Go
          </Button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ["Under ₹15,000", null, "15000"],
            ["₹15,000–₹40,000", "15000", "40000"],
            ["₹40,000+", "40000", null],
          ].map(([label, a, b]) => (
            <button
              key={label}
              onClick={() => update({ min: a, max: b })}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition",
                (sp.get("min") ?? null) === a && (sp.get("max") ?? null) === b ? "border-ink bg-ink text-canvas" : "border-line hover:border-ink/40"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Rating">
        <div className="space-y-2">
          {[4, 3].map((r) => (
            <button
              key={r}
              onClick={() => update({ rating: rating === r ? null : String(r) })}
              className={cn("flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition", rating === r ? "bg-sunken" : "hover:bg-sunken/60")}
            >
              <Stars value={r} size={13} /> <span className="text-xs text-muted">& up</span>
            </button>
          ))}
        </div>
      </FilterGroup>

      {facets && (
        <>
          <FilterGroup title="Size">
            <div className="flex flex-wrap gap-2">
              {facets.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleIn("sizes", sizes, s)}
                  className={cn(
                    "h-9 min-w-[44px] rounded-full border px-3 text-xs transition",
                    sizes.includes(s) ? "border-ink bg-ink text-canvas" : "border-line hover:border-ink/40"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </FilterGroup>
          <FilterGroup title="Colour">
            <div className="grid grid-cols-2 gap-2">
              {facets.colors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => toggleIn("colors", colors, c.name)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-full border px-2 py-1.5 text-xs transition",
                    colors.includes(c.name) ? "border-ink" : "border-transparent hover:border-line"
                  )}
                >
                  <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: c.hex }} />
                  {c.name}
                </button>
              ))}
            </div>
          </FilterGroup>
        </>
      )}
    </div>
  );

  return (
    <div className="container-x pb-10 pt-10 lg:pt-14">
      <div className="mb-10 flex flex-col gap-2">
        <p className="eyebrow">Shop</p>
        <h1 className="display text-5xl sm:text-6xl">{title}</h1>
      </div>

      <div className="sticky top-16 z-20 -mx-4 mb-8 flex items-center justify-between gap-4 border-y border-line bg-canvas/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:top-[72px] lg:mx-0 lg:rounded-full lg:border lg:px-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setDrawer(true)} className="flex items-center gap-2 text-sm lg:hidden">
            <SlidersHorizontal className="h-4 w-4" /> Filters {chips.length > 0 && `(${chips.length})`}
          </button>
          <p className="hidden text-sm text-muted lg:block">{items ? `${total} ${total === 1 ? "piece" : "pieces"}` : "Loading…"}</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="hidden text-muted sm:inline">Sort by</span>
          <select
            value={sort}
            onChange={(e) => update({ sort: e.target.value === "newest" ? null : e.target.value })}
            className="cursor-pointer rounded-full bg-transparent py-1 pr-1 text-sm font-medium focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-10 lg:grid-cols-[240px_1fr] xl:gap-14">
        <aside className="hidden lg:block">{filters}</aside>

        <div>
          {chips.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <button key={c.label} onClick={c.clear} className="flex items-center gap-1.5 rounded-full bg-sunken px-3 py-1.5 text-xs transition hover:bg-line">
                  {c.label} <X className="h-3 w-3" />
                </button>
              ))}
              <button onClick={() => router.replace(pathname)} className="ml-1 text-xs text-muted underline underline-offset-4 hover:text-ink">
                Clear all
              </button>
            </div>
          )}

          {items === null ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:gap-x-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="Nothing matches — yet"
              body="Try removing a filter or searching for something else."
              action={<Button variant="outline" onClick={() => router.replace(pathname)}>Clear filters</Button>}
            />
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:gap-x-6">
              {items.map((p, i) => (
                <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                  <ProductCard product={p} priority={i < 3} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] animate-fade-up flex-col rounded-t-3xl bg-canvas shadow-lift">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <p className="display text-2xl">Filters</p>
              <button onClick={() => setDrawer(false)} className="rounded-full p-2 hover:bg-sunken" aria-label="Close filters">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">{filters}</div>
            <div className="flex gap-3 border-t border-line p-4">
              <Button variant="outline" className="flex-1" onClick={() => router.replace(pathname)}>
                Clear
              </Button>
              <Button className="flex-1" onClick={() => setDrawer(false)}>
                Show {total} results
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-4">{title}</p>
      {children}
    </div>
  );
}

function PriceInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex h-10 flex-1 items-center rounded-full border border-line bg-surface px-3 text-sm focus-within:border-ink/50">
      <span className="text-muted">₹</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={`${placeholder} price`}
        className="w-full bg-transparent pl-1 focus:outline-none"
      />
    </div>
  );
}
