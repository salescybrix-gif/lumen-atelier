import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Package, RotateCcw, Sparkles } from "lucide-react";
import { getDb } from "@/lib/db";
import { toSummary } from "@/lib/utils";
import { ProductGallery } from "@/components/product/ProductGallery";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import { Reviews } from "@/components/product/Reviews";
import { ProductCard } from "@/components/product/ProductCard";
import { Price, Stars } from "@/components/ui/misc";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { slug: string } }) {
  const p = getDb().products.find((x) => x.slug === params.slug);
  return { title: p?.title ?? "Product", description: p?.description };
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const db = getDb();
  const product = db.products.find((p) => p.slug === params.slug && p.status === "active");
  if (!product) notFound();

  const reviews = db.reviews.filter((r) => r.productId === product.id).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const related = db.products
    .filter((p) => p.id !== product.id && p.status === "active")
    .sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category) || b.sold - a.sold)
    .slice(0, 4)
    .map(toSummary);
  const summary = toSummary(product);

  return (
    <div className="container-x pb-10 pt-6 lg:pt-10">
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/shop?category=${product.category}`} className="hover:text-ink">{product.category}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate text-ink">{product.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <div className="lg:sticky lg:top-28">
            <ProductGallery images={product.images} title={product.title} />
          </div>
        </div>

        <div className="lg:col-span-5">
          <p className="eyebrow">{product.category}</p>
          <h1 className="display mt-3 text-5xl leading-[1.02] sm:text-6xl">{product.title}</h1>
          <p className="mt-2 text-muted">{product.subtitle}</p>
          <div className="mt-5 flex flex-wrap items-center gap-5">
            <Price value={product.price} compareAt={product.compareAt} className="text-xl" />
            <a href="#reviews" className="flex items-center gap-2 text-xs text-muted hover:text-ink">
              <Stars value={product.rating} size={13} />
              {product.rating.toFixed(1)} · {product.reviewCount} reviews
            </a>
          </div>
          <p className="mt-7 leading-relaxed text-ink/80">{product.description}</p>

          <div className="my-8 h-px bg-line" />
          <PurchasePanel product={summary} />

          <div className="mt-10 grid grid-cols-3 gap-3 rounded-2xl border border-line p-4 text-center">
            {[
              [Package, "Free shipping", "over ₹15,000"],
              [RotateCcw, "Free returns", "within 30 days"],
              [Sparkles, "Lifetime care", "repairs & refresh"],
            ].map(([Icon, t, s]) => {
              const I = Icon as typeof Package;
              return (
                <div key={t as string} className="flex flex-col items-center gap-1.5">
                  <I className="h-4 w-4" strokeWidth={1.5} />
                  <p className="text-[11px] font-medium">{t as string}</p>
                  <p className="text-[10px] text-muted">{s as string}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 divide-y divide-line border-y border-line">
            <details className="group py-5" open>
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
                Details & composition <span className="text-muted transition group-open:rotate-45">+</span>
              </summary>
              <ul className="mt-4 space-y-2 text-sm text-ink/75">
                {product.details.map((d) => (
                  <li key={d} className="flex gap-3">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted" /> {d}
                  </li>
                ))}
                <li className="flex gap-3 text-muted">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted" /> SKU {product.sku}
                </li>
              </ul>
            </details>
            <details className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
                Shipping & returns <span className="text-muted transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-ink/75">
                Standard delivery in 4–6 business days, complimentary over ₹15,000 (₹299 below). Express and next-day delivery available in metro cities. Prices include GST. Returns are free
                within 30 days of delivery, in original condition.
              </p>
            </details>
          </div>
        </div>
      </div>

      <div className="mt-24">
        <Reviews slug={product.slug} initial={reviews} />
      </div>

      <section className="mt-24">
        <h2 className="display mb-10 text-4xl">You may also like</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
          {related.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
