"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Price, Stars } from "@/components/ui/misc";
import { PurchasePanel } from "./PurchasePanel";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";

export function QuickView() {
  const { quickView: p, openQuickView } = useUI();
  const [img, setImg] = useState(0);
  useEffect(() => setImg(0), [p?.id]);

  return (
    <Modal open={!!p} onClose={() => openQuickView(null)} size="xl">
      {p && (
        <div className="grid md:grid-cols-2">
          <div className="bg-sunken p-4 sm:p-6">
            <img src={p.images[img]} alt={p.title} className="aspect-[4/5] w-full rounded-2xl object-cover" />
            <div className="mt-3 flex gap-2">
              {p.images.slice(0, 4).map((src, i) => (
                <button
                  key={src + i}
                  onClick={() => setImg(i)}
                  className={cn("overflow-hidden rounded-lg ring-1 transition", i === img ? "ring-ink" : "ring-transparent opacity-70 hover:opacity-100")}
                >
                  <img src={src} alt="" className="h-16 w-12 object-cover" />
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col p-6 sm:p-10">
            <p className="eyebrow">{p.category}</p>
            <h2 className="display mt-2 text-4xl leading-tight">{p.title}</h2>
            <p className="mt-1 text-sm text-muted">{p.subtitle}</p>
            <div className="mt-4 flex items-center gap-4">
              <Price value={p.price} compareAt={p.compareAt} className="text-lg" />
              {p.reviewCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <Stars value={p.rating} size={12} /> {p.rating} ({p.reviewCount})
                </span>
              )}
            </div>
            <div className="my-7 h-px bg-line" />
            <PurchasePanel
              key={p.id}
              product={p}
              compact
              onColorChange={(i) => {
                const idx = p.images.length > 3 && i > 0 ? 3 : 0;
                setImg(idx);
              }}
              onAdded={() => openQuickView(null)}
            />
            <Link
              href={`/product/${p.slug}`}
              onClick={() => openQuickView(null)}
              className="mt-8 inline-flex items-center gap-2 text-xs font-medium underline-offset-4 hover:underline"
            >
              View full details <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </Modal>
  );
}
