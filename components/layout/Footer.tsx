"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { toast } from "@/lib/store/ui";

const COLS = [
  { title: "Shop", links: [["New arrivals", "/shop?sort=newest"], ["Clothing", "/shop?category=Outerwear,Knitwear"], ["Bags", "/shop?category=Bags"], ["Fragrance", "/shop?category=Fragrance"], ["Objects", "/shop?category=Objects"]] },
  { title: "Client care", links: [["My account", "/account"], ["Order tracking", "/account"], ["Shipping & returns", "/shop"], ["Care guide", "/shop"]] },
  { title: "Atelier", links: [["Our story", "/"], ["Craft & materials", "/"], ["Journal", "/"], ["Stockists", "/"]] },
];

export function Footer() {
  const [email, setEmail] = useState("");
  return (
    <footer className="mt-24 border-t border-line bg-surface/50">
      <div className="container-x grid gap-12 py-16 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="display text-3xl leading-tight sm:text-4xl">Letters from the atelier.</p>
          <p className="mt-3 max-w-sm text-sm text-muted">New collections, studio notes and private previews — a few times a season, never more.</p>
          <form
            className="mt-6 flex max-w-md items-center border-b border-ink/30 pb-2 focus-within:border-ink"
            onSubmit={(e) => {
              e.preventDefault();
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast({ title: "Please enter a valid email", tone: "error" });
              setEmail("");
              toast({ title: "You're on the list", description: "Welcome to Lumen Atelier.", tone: "success" });
            }}
          >
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" aria-label="Email address" className="flex-1 bg-transparent py-2 text-sm focus:outline-none" />
            <button aria-label="Subscribe" className="rounded-full p-2 transition hover:bg-sunken">
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-6 lg:col-start-7">
          {COLS.map((c) => (
            <div key={c.title}>
              <p className="eyebrow mb-4">{c.title}</p>
              <ul className="space-y-2.5">
                {c.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-ink/75 transition hover:text-ink">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-6 text-xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} Lumen Atelier. A demo storefront.</p>
          <p className="tracking-luxe">LUMEN</p>
        </div>
      </div>
    </footer>
  );
}
