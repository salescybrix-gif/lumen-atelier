"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";
import { toast } from "@/lib/store/ui";
import { useMounted } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import type { ProductSummary } from "@/types";

/** Variant selection (colour + size), stock indicator, quantity and purchase CTAs. */
export function PurchasePanel({
  product,
  onColorChange,
  onAdded,
  compact,
}: {
  product: ProductSummary;
  onColorChange?: (index: number) => void;
  onAdded?: () => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const mounted = useMounted();
  const add = useCart((s) => s.add);
  const setCartOpen = useCart((s) => s.setOpen);
  const wishlist = useWishlist();
  const saved = mounted && wishlist.items.some((i) => i.id === product.id);

  const firstInStock = product.sizes.find((s) => (product.inventory[s] ?? 0) > 0);
  const [color, setColor] = useState(0);
  const [size, setSize] = useState<string | null>(product.sizes.length === 1 ? product.sizes[0] : null);
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);

  const stock = size ? product.inventory[size] ?? 0 : product.stock;
  const soldOut = product.stock === 0;

  const commit = (buyNow: boolean) => {
    if (!size) {
      setSizeError(true);
      return;
    }
    if (stock === 0) return;
    add(
      {
        productId: product.id,
        slug: product.slug,
        title: product.title,
        image: product.images[0],
        category: product.category,
        price: product.price,
        size,
        color: product.colors[color]?.name ?? "Default",
        maxQty: stock,
      },
      qty
    );
    onAdded?.();
    if (buyNow) {
      router.push("/checkout");
    } else {
      setCartOpen(true);
      toast({ title: "Added to bag", description: `${product.title} · ${product.colors[color]?.name} · ${size}`, tone: "success" });
    }
  };

  return (
    <div className="space-y-7">
      {product.colors.length > 0 && (
        <div>
          <p className="mb-3 text-xs text-muted">
            Colour — <span className="text-ink">{product.colors[color]?.name}</span>
          </p>
          <div className="flex flex-wrap gap-2.5">
            {product.colors.map((c, i) => (
              <button
                key={c.name}
                onClick={() => {
                  setColor(i);
                  onColorChange?.(i);
                }}
                aria-label={c.name}
                aria-pressed={i === color}
                className={cn(
                  "h-9 w-9 rounded-full p-[3px] ring-1 transition",
                  i === color ? "ring-ink" : "ring-line hover:ring-ink/40"
                )}
              >
                <span className="block h-full w-full rounded-full border border-black/5" style={{ background: c.hex }} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className={cn("text-xs", sizeError ? "text-danger" : "text-muted")}>{sizeError ? "Please select a size" : "Size"}</p>
          {product.sizes.length > 2 && <button className="text-xs text-muted underline underline-offset-4 hover:text-ink">Size guide</button>}
        </div>
        <div className="flex flex-wrap gap-2">
          {product.sizes.map((s) => {
            const n = product.inventory[s] ?? 0;
            return (
              <button
                key={s}
                disabled={n === 0}
                onClick={() => {
                  setSize(s);
                  setSizeError(false);
                  setQty(1);
                }}
                className={cn(
                  "relative h-11 min-w-[56px] rounded-full border px-4 text-[13px] transition",
                  size === s ? "border-ink bg-ink text-canvas" : "border-line hover:border-ink/50",
                  n === 0 && "cursor-not-allowed text-muted/60 line-through decoration-1"
                )}
              >
                {s}
                {n > 0 && n <= 3 && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-warning ring-2 ring-canvas" />}
              </button>
            );
          })}
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs">
          <span className={cn("h-1.5 w-1.5 rounded-full", soldOut || stock === 0 ? "bg-danger" : stock <= 3 ? "bg-warning" : "bg-success")} />
          <span className="text-muted">
            {soldOut
              ? "Sold out — restocking soon"
              : !size
              ? firstInStock
                ? "In stock, ready to ship"
                : "Sold out"
              : stock === 0
              ? "This size is sold out"
              : stock <= 3
              ? `Only ${stock} left in ${size}`
              : `In stock · ships in 1–2 days`}
          </span>
        </p>
      </div>

      <div className={cn("flex gap-3", compact ? "flex-col sm:flex-row" : "flex-col")}>
        <div className="flex gap-3">
          <div className="flex h-14 items-center rounded-full border border-line">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 text-muted hover:text-ink" aria-label="Decrease quantity">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-6 text-center text-sm tabular-nums">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(Math.max(1, stock), q + 1))} className="px-4 text-muted hover:text-ink" aria-label="Increase quantity">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <Button size="lg" className="flex-1" disabled={soldOut || (!!size && stock === 0)} onClick={() => commit(false)}>
            {soldOut ? "Sold out" : "Add to bag"}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-14 px-0"
            aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
            onClick={() => {
              const now = wishlist.toggle(product);
              toast({ title: now ? "Saved to wishlist" : "Removed from wishlist", tone: now ? "success" : "default", action: now ? { label: "View wishlist", href: "/account?tab=wishlist" } : undefined });
            }}
          >
            <Heart className={cn("h-5 w-5 transition", saved && "fill-ink")} />
          </Button>
        </div>
        {!compact && (
          <Button size="lg" variant="outline" disabled={soldOut} onClick={() => commit(true)}>
            Buy now
          </Button>
        )}
      </div>
    </div>
  );
}
