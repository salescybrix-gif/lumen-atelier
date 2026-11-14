"use client";
import { useRef, useState } from "react";
import { ImagePlus, Plus, Sparkles, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { artUrl } from "@/lib/art";
import { toast } from "@/lib/store/ui";
import { cn } from "@/lib/utils";
import { CATEGORIES, type ColorOption, type Product } from "@/types";

const DEFAULT_SIZES: Record<string, string[]> = {
  Outerwear: ["XS", "S", "M", "L", "XL"],
  Knitwear: ["XS", "S", "M", "L", "XL"],
  Bags: ["One Size"],
  Fragrance: ["50 ml", "100 ml"],
  Objects: ["One Size"],
};

/** Downscale an uploaded image to a JPEG data URL (keeps the JSON mock DB small). */
function readImage(file: File, max = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function ProductForm({ product, open, onClose, onSaved }: { product: Product | null; open: boolean; onClose: () => void; onSaved: (p: Product) => void }) {
  const editing = !!product;
  const [f, setF] = useState(() => ({
    title: product?.title ?? "",
    subtitle: product?.subtitle ?? "",
    description: product?.description ?? "",
    details: product?.details.join("\n") ?? "",
    price: product ? String(product.price / 100) : "",
    compareAt: product?.compareAt ? String(product.compareAt / 100) : "",
    sku: product?.sku ?? "",
    category: product?.category ?? "Outerwear",
    tags: product?.tags.join(", ") ?? "",
    sizes: product?.sizes ?? DEFAULT_SIZES.Outerwear,
    inventory: product?.inventory ?? ({} as Record<string, number>),
    colors: product?.colors ?? ([{ name: "Natural", hex: "#c8b393" }] as ColorOption[]),
    images: product?.images ?? ([] as string[]),
    featured: product?.featured ?? false,
    status: product?.status ?? "active",
  }));
  const [sizeInput, setSizeInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    const list = Array.from(files).filter((x) => x.type.startsWith("image/")).slice(0, 8);
    try {
      const urls = await Promise.all(list.map((x) => readImage(x)));
      setF((s) => ({ ...s, images: [...s.images, ...urls] }));
    } catch {
      toast({ title: "Couldn't read one of those images", tone: "error" });
    }
  };

  const generate = () => {
    const hex = f.colors[0]?.hex ?? "#c8b393";
    const next = [0, 1, 2].map((v) => artUrl(f.category, hex, v)).filter((u) => !f.images.includes(u));
    set("images", [...f.images, ...next]);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...f,
        price: Number(f.price),
        compareAt: f.compareAt ? Number(f.compareAt) : undefined,
        tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
        details: f.details.split("\n").map((t) => t.trim()).filter(Boolean),
      };
      const { product: saved } = await api<{ product: Product }>(editing ? `/api/admin/products/${product!.id}` : "/api/admin/products", {
        method: editing ? "PATCH" : "POST",
        body,
      });
      onSaved(saved);
      toast({ title: editing ? "Product updated" : "Product created", description: saved.title, tone: "success" });
      onClose();
    } catch (err) {
      toast({ title: (err as Error).message, tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? "Edit product" : "Add product"}
      description={editing ? `${product!.sku} · ${product!.title}` : "Create a new product in the catalogue."}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit" form="product-form" loading={saving}>{editing ? "Save changes" : "Create product"}</Button>
        </>
      }
    >
      <form id="product-form" onSubmit={save} className="space-y-8 p-6 sm:p-8">
        {/* Images */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium text-muted">Images · first image is the cover</p>
            <button type="button" onClick={generate} className="flex items-center gap-1.5 text-xs text-muted hover:text-ink">
              <Sparkles className="h-3.5 w-3.5" /> Generate studio renders
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {f.images.map((src, i) => (
              <div key={i} className="group relative">
                <img src={src} alt="" className={cn("aspect-[4/5] w-full rounded-xl object-cover", i === 0 && "ring-2 ring-ink ring-offset-2 ring-offset-surface")} />
                <button type="button" onClick={() => set("images", f.images.filter((_, k) => k !== i))} className="glass absolute right-1.5 top-1.5 rounded-full p-1 opacity-0 transition group-hover:opacity-100" aria-label="Remove image">
                  <X className="h-3.5 w-3.5" />
                </button>
                {i > 0 && (
                  <button type="button" onClick={() => set("images", [src, ...f.images.filter((_, k) => k !== i)])} className="glass absolute bottom-1.5 left-1.5 rounded-full px-2 py-0.5 text-[10px] opacity-0 transition group-hover:opacity-100">
                    Make cover
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
              className={cn("flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-xs text-muted transition hover:border-ink/50 hover:text-ink", dragOver ? "border-ink bg-sunken" : "border-line")}
            >
              <ImagePlus className="h-5 w-5" /> Upload
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
        </section>

        {/* Basics */}
        <section className="grid gap-4 sm:grid-cols-2">
          <Input wrapClassName="sm:col-span-2" label="Title" value={f.title} onChange={(e) => set("title", e.target.value)} required />
          <Input wrapClassName="sm:col-span-2" label="Subtitle" value={f.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="e.g. Double-faced Italian wool" />
          <Textarea wrapClassName="sm:col-span-2" label="Description" value={f.description} onChange={(e) => set("description", e.target.value)} />
          <Textarea wrapClassName="sm:col-span-2" label="Details (one per line)" value={f.details} onChange={(e) => set("details", e.target.value)} className="min-h-[90px]" />
          <Input label="Price (₹)" type="number" step="0.01" min="0" value={f.price} onChange={(e) => set("price", e.target.value)} required />
          <Input label="MRP / compare-at (optional)" type="number" step="0.01" min="0" value={f.compareAt} onChange={(e) => set("compareAt", e.target.value)} hint="Shows as a sale when higher than price." />
          <Select
            label="Category"
            value={f.category}
            onChange={(e) => {
              const c = e.target.value as Product["category"];
              setF((s) => ({ ...s, category: c, sizes: editing ? s.sizes : DEFAULT_SIZES[c] }));
            }}
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
          <Input label="SKU" value={f.sku} onChange={(e) => set("sku", e.target.value)} placeholder="Auto-generated if blank" />
          <Input wrapClassName="sm:col-span-2" label="Tags (comma separated)" value={f.tags} onChange={(e) => set("tags", e.target.value)} placeholder="wool, bestseller, gift" />
        </section>

        {/* Inventory */}
        <section>
          <p className="mb-3 text-xs font-medium text-muted">Sizes & stock</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {f.sizes.map((s) => (
              <div key={s} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2">
                <span className="flex-1 truncate text-sm">{s}</span>
                <input
                  type="number"
                  min={0}
                  value={f.inventory[s] ?? 0}
                  onChange={(e) => set("inventory", { ...f.inventory, [s]: Number(e.target.value) })}
                  className="w-14 rounded-md bg-sunken px-2 py-1 text-right text-sm tabular-nums focus:outline-none"
                  aria-label={`Stock for ${s}`}
                />
                <button type="button" onClick={() => set("sizes", f.sizes.filter((x) => x !== s))} className="text-muted hover:text-danger" aria-label={`Remove size ${s}`}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2">
              <input value={sizeInput} onChange={(e) => setSizeInput(e.target.value)} placeholder="Add size" className="w-full bg-transparent text-sm focus:outline-none" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (sizeInput.trim() && !f.sizes.includes(sizeInput.trim())) set("sizes", [...f.sizes, sizeInput.trim()]); setSizeInput(""); } }} />
              <button type="button" onClick={() => { if (sizeInput.trim() && !f.sizes.includes(sizeInput.trim())) set("sizes", [...f.sizes, sizeInput.trim()]); setSizeInput(""); }} aria-label="Add size">
                <Plus className="h-4 w-4 text-muted" />
              </button>
            </div>
          </div>
        </section>

        {/* Colours */}
        <section>
          <p className="mb-3 text-xs font-medium text-muted">Colours</p>
          <div className="flex flex-wrap gap-2">
            {f.colors.map((c, i) => (
              <div key={i} className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-2">
                <input type="color" value={c.hex} onChange={(e) => set("colors", f.colors.map((x, k) => (k === i ? { ...x, hex: e.target.value } : x)))} className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0" aria-label="Colour swatch" />
                <input value={c.name} onChange={(e) => set("colors", f.colors.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} className="w-20 bg-transparent text-sm focus:outline-none" aria-label="Colour name" />
                {f.colors.length > 1 && (
                  <button type="button" onClick={() => set("colors", f.colors.filter((_, k) => k !== i))} className="text-muted hover:text-danger" aria-label="Remove colour">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => set("colors", [...f.colors, { name: "New", hex: "#8f8a84" }])} className="flex items-center gap-1 rounded-full border border-dashed border-line px-3 text-xs text-muted hover:text-ink">
              <Plus className="h-3.5 w-3.5" /> Colour
            </button>
          </div>
        </section>

        <section className="flex flex-wrap gap-6">
          <Checkbox label="Featured on homepage" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} />
          <Checkbox label="Archived (hidden from store)" checked={f.status === "archived"} onChange={(e) => set("status", e.target.checked ? "archived" : "active")} />
        </section>
      </form>
    </Modal>
  );
}
