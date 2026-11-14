"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useCart, cartCount, cartSubtotal } from "@/lib/store/cart";
import { useEscape, useMounted, useScrollLock } from "@/lib/hooks";
import { FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/misc";

export function CartDrawer() {
  const mounted = useMounted();
  const router = useRouter();
  const { items, open, setOpen, setQty, remove } = useCart();
  useScrollLock(open);
  useEscape(() => setOpen(false), open);
  if (!mounted || !open) return null;

  const subtotal = cartSubtotal(items);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className="fixed inset-0 z-[75]" role="dialog" aria-modal="true" aria-label="Shopping bag">
      <div className="absolute inset-0 animate-fade-in bg-black/35 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[440px] animate-slide-in-right flex-col bg-canvas shadow-lift">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="display text-2xl">
            Your bag <span className="font-sans text-sm text-muted">({cartCount(items)})</span>
          </h2>
          <button onClick={() => setOpen(false)} className="-mr-2 rounded-full p-2 hover:bg-sunken" aria-label="Close bag">
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 items-center">
            <EmptyState
              icon={<ShoppingBag className="h-6 w-6" />}
              title="Your bag is empty"
              body="Discover considered pieces made to be kept for a lifetime."
              action={
                <Button onClick={() => { setOpen(false); router.push("/shop"); }}>Explore the collection</Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="border-b border-line px-6 py-4">
              <p className="text-xs text-muted">
                {remaining > 0 ? (
                  <>You're <span className="font-medium text-ink">{formatPrice(remaining)}</span> away from complimentary shipping.</>
                ) : (
                  <span className="text-ink">You've unlocked complimentary shipping.</span>
                )}
              </p>
              <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-sunken">
                <div className="h-full rounded-full bg-ink transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
              {items.map((i) => (
                <li key={i.key} className="flex gap-4 py-5 animate-fade-in">
                  <Link href={`/product/${i.slug}`} onClick={() => setOpen(false)} className="shrink-0">
                    <img src={i.image} alt={i.title} className="h-28 w-[88px] rounded-xl object-cover" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/product/${i.slug}`} onClick={() => setOpen(false)} className="block truncate text-sm font-medium">
                          {i.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted">
                          {i.color} · {i.size}
                        </p>
                      </div>
                      <p className="text-sm tabular-nums">{formatPrice(i.price * i.qty)}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center rounded-full border border-line">
                        <button onClick={() => (i.qty > 1 ? setQty(i.key, i.qty - 1) : remove(i.key))} className="p-2 text-muted hover:text-ink" aria-label="Decrease quantity">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs tabular-nums">{i.qty}</span>
                        <button onClick={() => setQty(i.key, i.qty + 1)} disabled={i.qty >= i.maxQty} className="p-2 text-muted hover:text-ink disabled:opacity-30" aria-label="Increase quantity">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button onClick={() => remove(i.key)} className="text-xs text-muted underline-offset-4 hover:text-ink hover:underline">
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-4 border-t border-line bg-surface/60 px-6 py-5">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="font-medium tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-muted">Shipping and taxes calculated at checkout.</p>
              <Button size="lg" className="w-full" onClick={() => { setOpen(false); router.push("/checkout"); }}>
                Checkout · {formatPrice(subtotal)}
              </Button>
              <button onClick={() => setOpen(false)} className="w-full text-center text-xs text-muted hover:text-ink">
                Continue shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
