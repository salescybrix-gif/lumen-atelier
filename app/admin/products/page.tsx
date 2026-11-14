"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Archive, ArchiveRestore, ExternalLink, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { Button } from "@/components/ui/Button";
import { Badge, EmptyState, Skeleton } from "@/components/ui/misc";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";
import { toast } from "@/lib/store/ui";
import { cn, formatPrice, totalStock } from "@/lib/utils";
import { CATEGORIES, type Product } from "@/types";

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<"all" | "active" | "archived">("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ products: Product[] }>("/api/admin/products").then((d) => setProducts(d.products));
  }, []);

  const list = useMemo(() => {
    if (!products) return null;
    const s = q.toLowerCase();
    return products.filter(
      (p) =>
        (category === "all" || p.category === category) &&
        (status === "all" || p.status === status) &&
        (!s || `${p.title} ${p.sku} ${p.tags.join(" ")}`.toLowerCase().includes(s))
    );
  }, [products, q, category, status]);

  const upsert = (p: Product) => setProducts((ps) => (ps ? (ps.some((x) => x.id === p.id) ? ps.map((x) => (x.id === p.id ? p : x)) : [p, ...ps]) : ps));

  const toggleArchive = async (p: Product) => {
    const next = p.status === "archived" ? "active" : "archived";
    try {
      const { product } = await api<{ product: Product }>(`/api/admin/products/${p.id}`, { method: "PATCH", body: { status: next } });
      upsert(product);
      toast({ title: next === "archived" ? "Product archived" : "Product restored", description: p.title });
    } catch (err) {
      toast({ title: (err as Error).message, tone: "error" });
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/api/admin/products/${deleting.id}`, { method: "DELETE" });
      setProducts((ps) => ps?.filter((x) => x.id !== deleting.id) ?? null);
      toast({ title: "Product deleted", description: deleting.title });
      setDeleting(null);
    } catch (err) {
      toast({ title: (err as Error).message, tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Products"
        sub={products ? `${products.length} products · ${products.filter((p) => p.status === "active").length} active` : "Loading…"}
        action={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" /> Add product
          </Button>
        }
      />

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <div className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-full border border-line bg-canvas px-4 focus-within:border-ink/50">
            <Search className="h-4 w-4 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, SKU or tag" className="w-full bg-transparent text-sm focus:outline-none" />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 rounded-full border border-line bg-canvas px-4 text-sm focus:outline-none" aria-label="Filter by category">
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <div className="flex rounded-full border border-line bg-canvas p-1">
            {(["all", "active", "archived"] as const).map((s) => (
              <button key={s} onClick={() => setStatus(s)} className={cn("rounded-full px-3.5 py-1 text-xs capitalize transition", status === s ? "bg-ink text-canvas" : "text-muted hover:text-ink")}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-line bg-sunken/50 text-left text-[11px] uppercase tracking-wider text-muted">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-3 py-3 font-medium">SKU</th>
                <th className="px-3 py-3 font-medium">Category</th>
                <th className="px-3 py-3 font-medium">Stock</th>
                <th className="px-3 py-3 text-right font-medium">Price</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {!list
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-5 py-3"><Skeleton className="h-12 w-full" /></td>
                    </tr>
                  ))
                : list.map((p) => {
                    const stock = totalStock(p);
                    return (
                      <tr key={p.id} className={cn("transition hover:bg-sunken/40", p.status === "archived" && "opacity-60")}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <img src={p.images[0]} alt="" className="h-14 w-11 rounded-lg object-cover" />
                            <div className="min-w-0">
                              <p className="truncate font-medium">{p.title}</p>
                              <p className="text-xs text-muted">{p.sold} sold · {p.rating ? `${p.rating}★` : "No reviews"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-muted">{p.sku}</td>
                        <td className="px-3 py-3">{p.category}</td>
                        <td className="px-3 py-3">
                          <span className={cn("tabular-nums", stock === 0 ? "text-danger" : stock <= 10 ? "text-warning" : "")}>{stock}</span>
                          <span className="ml-1 text-xs text-muted">units</span>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">{formatPrice(p.price)}</td>
                        <td className="px-3 py-3">
                          {p.status === "active" ? <Badge tone="success">Active</Badge> : <Badge>Archived</Badge>}
                          {p.featured && <Badge tone="info" className="ml-1">Featured</Badge>}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-1">
                            {p.status === "active" && (
                              <Link href={`/product/${p.slug}`} target="_blank" className="rounded-lg p-2 text-muted hover:bg-sunken hover:text-ink" aria-label="View in store">
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            )}
                            <button onClick={() => { setEditing(p); setFormOpen(true); }} className="rounded-lg p-2 text-muted hover:bg-sunken hover:text-ink" aria-label="Edit">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => toggleArchive(p)} className="rounded-lg p-2 text-muted hover:bg-sunken hover:text-ink" aria-label={p.status === "archived" ? "Restore" : "Archive"}>
                              {p.status === "archived" ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                            </button>
                            <button onClick={() => setDeleting(p)} className="rounded-lg p-2 text-muted hover:bg-danger/10 hover:text-danger" aria-label="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
          {list && list.length === 0 && <EmptyState title="No products found" body="Try a different search or filter." />}
        </div>
      </div>

      {formOpen && <ProductForm key={editing?.id ?? "new"} product={editing} open={formOpen} onClose={() => setFormOpen(false)} onSaved={upsert} />}

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        size="sm"
        title="Delete product?"
        description="This permanently removes the product and its reviews. Past orders keep their line items. Consider archiving instead."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="danger" loading={busy} onClick={remove}>Delete</Button>
          </>
        }
      >
        {deleting && (
          <div className="flex items-center gap-4 p-6 sm:p-8">
            <img src={deleting.images[0]} alt="" className="h-16 w-12 rounded-lg object-cover" />
            <div>
              <p className="font-medium">{deleting.title}</p>
              <p className="text-xs text-muted">{deleting.sku}</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
