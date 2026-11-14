"use client";
import Link from "next/link";
import { Eye, Heart } from "lucide-react";
import { useWishlist } from "@/lib/store/wishlist";
import { toast, useUI } from "@/lib/store/ui";
import { useMounted } from "@/lib/hooks";
import { Badge, Price, Skeleton, Stars } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import type { ProductSummary } from "@/types";

export function ProductCard({ product, priority, className }: { product: ProductSummary; priority?: boolean; className?: string }) {
  const mounted = useMounted();
  const wishlist = useWishlist();
  const openQuickView = useUI((s) => s.openQuickView);
  const saved = mounted && wishlist.items.some((i) => i.id === product.id);
  const isNew = Date.now() - new Date(product.createdAt).getTime() < 1000 * 60 * 60 * 24 * 45;
  const onSale = !!product.compareAt && product.compareAt > product.price;
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className={cn("group", className)}>
      <div className="relative">
      <Link href={`/product/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-sunken">
        <img
          src={product.images[0]}
          alt={product.title}
          loading={priority ? "eager" : "lazy"}
          className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03] group-hover:opacity-0"
        />
        <img
          src={product.images[1] ?? product.images[0]}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 h-full w-full scale-[1.03] object-cover opacity-0 transition duration-700 ease-out group-hover:scale-100 group-hover:opacity-100"
        />
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.stock === 0 ? (
            <Badge tone="dark">Sold out</Badge>
          ) : onSale ? (
            <Badge tone="dark">Sale</Badge>
          ) : isNew ? (
            <Badge className="glass border-transparent">New</Badge>
          ) : null}
          {lowStock && <Badge className="glass border-transparent">Only {product.stock} left</Badge>}
        </div>
      </Link>

      <button
        onClick={() => {
          const now = wishlist.toggle(product);
          toast({ title: now ? "Saved to wishlist" : "Removed from wishlist", description: product.title, tone: now ? "success" : "default" });
        }}
        aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
        className="glass absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full shadow-soft transition hover:scale-105"
      >
        <Heart className={cn("h-4 w-4 transition", saved ? "fill-ink" : "")} />
      </button>

      <button
        onClick={() => openQuickView(product)}
        className="glass absolute inset-x-3 bottom-3 hidden h-11 translate-y-2 items-center justify-center gap-2 rounded-full text-xs font-medium tracking-wide opacity-0 shadow-soft transition duration-300 focus-visible:translate-y-0 focus-visible:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 md:flex"
      >
        <Eye className="h-4 w-4" /> Quick view
      </button>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/product/${product.slug}`} className="block truncate text-sm font-medium">
            {product.title}
          </Link>
          <p className="mt-0.5 truncate text-xs text-muted">{product.subtitle}</p>
        </div>
        <Price value={product.price} compareAt={product.compareAt} className="shrink-0 text-sm" />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex gap-1.5">
          {product.colors.slice(0, 4).map((c) => (
            <span key={c.name} title={c.name} className="h-3 w-3 rounded-full border border-black/10" style={{ background: c.hex }} />
          ))}
          {product.colors.length > 4 && <span className="text-[10px] text-muted">+{product.colors.length - 4}</span>}
        </div>
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1.5">
            <Stars value={product.rating} size={11} />
            <span className="text-[11px] text-muted">({product.reviewCount})</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
      <div className="mt-4 flex justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-4 w-14" />
      </div>
    </div>
  );
}
