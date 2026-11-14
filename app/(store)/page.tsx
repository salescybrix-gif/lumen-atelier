import Link from "next/link";
import { ArrowRight, Package, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { getDb, queryProducts } from "@/lib/db";
import { artUrl } from "@/lib/art";
import { buttonClass } from "@/lib/button-class";
import { toSummary } from "@/lib/utils";
import { ProductCard } from "@/components/product/ProductCard";
import { CATEGORIES } from "@/types";

export const dynamic = "force-dynamic";

const CATEGORY_ART: Record<string, [string, string]> = {
  Outerwear: ["Outerwear", "#a77b4f"],
  Knitwear: ["Knitwear", "#8f8a84"],
  Bags: ["Bags", "#8a4b2a"],
  Fragrance: ["Fragrance", "#c08a3e"],
  Objects: ["Objects", "#58606a"],
};

const TRUST = [
  { icon: Package, title: "Complimentary shipping", body: "On all orders over ₹15,000" },
  { icon: RotateCcw, title: "30-day returns", body: "Free, no questions asked" },
  { icon: Sparkles, title: "Lifetime repairs", body: "On all leather and outerwear" },
  { icon: ShieldCheck, title: "Secure checkout", body: "Cards, UPI & net banking" },
];

export default function HomePage() {
  const db = getDb();
  const featured = db.products.filter((p) => p.featured && p.status === "active").slice(0, 4).map(toSummary);
  const newest = queryProducts({ sort: "newest", limit: 8 }).items;
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, db.products.filter((p) => p.category === c && p.status === "active").length]));

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden">
        <div className="container-x grid items-center gap-10 pb-16 pt-10 lg:min-h-[calc(100vh-110px)] lg:grid-cols-12 lg:gap-6 lg:py-12">
          <div className="lg:col-span-5">
            <p className="eyebrow animate-fade-up">Autumn / Winter 2026</p>
            <h1 className="display mt-5 animate-fade-up text-[56px] leading-[0.95] [animation-delay:80ms] sm:text-7xl xl:text-[104px]">
              The quiet
              <br />
              <em className="text-accent">season.</em>
            </h1>
            <p className="mt-6 max-w-md animate-fade-up text-[15px] leading-relaxed text-muted [animation-delay:160ms]">
              Double-faced wool, vegetable-tanned leather and slow-poured fragrance. Pieces made by hand, in small numbers, to be
              kept for a lifetime.
            </p>
            <div className="mt-9 flex animate-fade-up flex-wrap gap-3 [animation-delay:240ms]">
              <Link href="/shop" className={buttonClass("primary", "lg")}>
                Shop the collection <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/shop?category=Objects" className={buttonClass("outline", "lg")}>
                Explore objects
              </Link>
            </div>
            <dl className="mt-12 grid max-w-md animate-fade-up grid-cols-3 gap-6 border-t border-line pt-6 [animation-delay:320ms]">
              {[
                ["4.8/5", "Client rating"],
                ["38", "Partner ateliers"],
                ["100%", "Traceable fibres"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="display text-2xl">{v}</dt>
                  <dd className="mt-1 text-[11px] text-muted">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative lg:col-span-7">
            <div className="grid grid-cols-5 gap-3 sm:gap-4">
              <Link href={`/product/${featured[0]?.slug ?? ""}`} className="group col-span-3 overflow-hidden rounded-3xl">
                <img
                  src={artUrl("Outerwear", "#a77b4f", 0)}
                  alt="Arden wool overcoat in camel"
                  className="aspect-[4/5] w-full animate-fade-in object-cover transition duration-[1.2s] group-hover:scale-[1.03]"
                />
              </Link>
              <div className="col-span-2 flex flex-col gap-3 sm:gap-4">
                <img src={artUrl("Fragrance", "#c08a3e", 1)} alt="No. 04 Cèdre eau de parfum" className="aspect-[4/5] w-full animate-fade-in rounded-3xl object-cover [animation-delay:150ms]" />
                <img src={artUrl("Bags", "#8a4b2a", 0)} alt="Vale leather tote" className="aspect-square w-full animate-fade-in rounded-3xl object-cover [animation-delay:300ms]" />
              </div>
            </div>
            <div className="glass absolute -bottom-5 left-4 hidden max-w-[260px] animate-fade-up rounded-2xl border border-white/30 p-4 shadow-lift [animation-delay:500ms] sm:block lg:-left-8 lg:bottom-10">
              <p className="eyebrow">Just landed</p>
              <p className="display mt-1 text-xl">Arden Wool Overcoat</p>
              <p className="mt-1 text-xs text-muted">Woven in Biella · Unlined · Three colours</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Trust badges ---------- */}
      <section className="border-y border-line bg-surface/50">
        <div className="container-x grid grid-cols-2 gap-6 py-8 lg:grid-cols-4">
          {TRUST.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-center gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line">
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </span>
              <div>
                <p className="text-[13px] font-medium">{title}</p>
                <p className="text-xs text-muted">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Featured ---------- */}
      <section className="container-x py-20 lg:py-28">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Signature pieces</p>
            <h2 className="display mt-3 text-4xl sm:text-5xl">The essentials, perfected.</h2>
          </div>
          <Link href="/shop?sort=popular" className="link-underline hidden shrink-0 text-sm sm:block">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 2} />
          ))}
        </div>
      </section>

      {/* ---------- Categories ---------- */}
      <section className="container-x">
        <div className="mb-10">
          <p className="eyebrow">Shop by category</p>
          <h2 className="display mt-3 text-4xl sm:text-5xl">Five disciplines, one hand.</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {CATEGORIES.map((c, i) => {
            const [cat, hex] = CATEGORY_ART[c];
            return (
              <Link
                key={c}
                href={`/shop?category=${c}`}
                className={`group relative overflow-hidden rounded-3xl ${i === 0 ? "col-span-2 lg:col-span-1" : ""}`}
              >
                <img
                  src={artUrl(cat, hex, i % 2 === 0 ? 2 : 1)}
                  alt=""
                  className={`w-full object-cover transition duration-700 group-hover:scale-105 ${i === 0 ? "aspect-[2/1] lg:aspect-[3/4]" : "aspect-[3/4]"}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-black/0" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-white">
                  <div>
                    <p className="display text-2xl sm:text-3xl">{c}</p>
                    <p className="text-xs text-white/75">{counts[c]} pieces</p>
                  </div>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20 backdrop-blur transition group-hover:bg-white group-hover:text-black">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---------- Promotional banner ---------- */}
      <section className="container-x py-20 lg:py-28">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#171513] text-[#efe9df]">
          <img src={artUrl("Knitwear", "#22252b", 1)} alt="" className="absolute inset-y-0 right-0 hidden h-full w-1/2 object-cover opacity-80 md:block" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171513] via-[#171513]/95 to-transparent md:via-[#171513]/80" />
          <div className="relative max-w-xl px-8 py-16 sm:px-14 sm:py-24">
            <p className="text-[11px] font-medium uppercase tracking-luxe text-[#efe9df]/60">The Winter Archive · Limited time</p>
            <h2 className="display mt-5 text-5xl leading-[1] sm:text-6xl">
              Up to 20% off <em>selected</em> pieces.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-[#efe9df]/70">
              A rare edit of past-season outerwear, linen and travel goods. Once they're gone, they won't be remade.
            </p>
            <Link
              href="/shop?q=sale"
              className="mt-9 inline-flex h-14 items-center gap-2 rounded-full bg-[#efe9df] px-8 text-sm font-medium text-[#171513] transition hover:bg-white"
            >
              Shop the archive <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- New arrivals rail ---------- */}
      <section className="container-x">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">New arrivals</p>
            <h2 className="display mt-3 text-4xl sm:text-5xl">Recently from the studio.</h2>
          </div>
          <Link href="/shop?sort=newest" className="link-underline hidden shrink-0 text-sm sm:block">
            Shop new
          </Link>
        </div>
        <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:gap-6 lg:px-0">
          {newest.map((p) => (
            <ProductCard key={p.id} product={p} className="w-[68%] shrink-0 snap-start sm:w-[40%] lg:w-[calc(25%-18px)]" />
          ))}
        </div>
      </section>

      {/* ---------- Editorial ---------- */}
      <section className="container-x pt-20 lg:pt-28">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <img src={artUrl("Objects", "#e4dccd", 0)} alt="Hand-thrown stoneware vase" className="aspect-[5/4] w-full rounded-3xl object-cover" />
          <div>
            <p className="eyebrow">Our approach</p>
            <h2 className="display mt-4 text-4xl leading-tight sm:text-5xl">Fewer things, made better, kept longer.</h2>
            <p className="mt-6 max-w-lg leading-relaxed text-muted">
              Every Lumen piece begins with a material we would want to live with for decades. We work with 38 family-run ateliers
              across Italy, Portugal and Japan — paying fairly, producing in small runs, and repairing what we make for life.
            </p>
            <Link href="/shop" className="link-underline mt-8 inline-block text-sm font-medium">
              Discover the collection
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
