import "server-only";
import fs from "node:fs";
import path from "node:path";
import { buildSeed } from "@/lib/seed";
import type { Database, Product, ProductQuery, PublicUser, User } from "@/types";
import { toSummary, totalStock } from "@/lib/utils";

/**
 * A tiny JSON-file database. Data lives in `.data/db.json` and is seeded on first use.
 * The interface (getDb / commit) is intentionally narrow, so swapping it for Prisma +
 * PostgreSQL only means re-implementing this module.
 */
const DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "db.json");

const g = globalThis as unknown as { __lumenDb?: Database };

export function getDb(): Database {
  if (g.__lumenDb && fs.existsSync(FILE)) return g.__lumenDb;
  if (fs.existsSync(FILE)) {
    g.__lumenDb = JSON.parse(fs.readFileSync(FILE, "utf8")) as Database;
  } else {
    g.__lumenDb = buildSeed();
    commit();
  }
  return g.__lumenDb!;
}

export function commit() {
  if (!g.__lumenDb) return;
  fs.mkdirSync(DIR, { recursive: true });
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(g.__lumenDb));
  fs.renameSync(tmp, FILE);
}

export function publicUser(u: User): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...rest } = u;
  return rest;
}

export function queryProducts(q: ProductQuery, opts: { includeArchived?: boolean } = {}) {
  const db = getDb();
  let list: Product[] = db.products.filter((p) => opts.includeArchived || p.status === "active");

  if (q.q) {
    const terms = q.q.toLowerCase().split(/\s+/).filter(Boolean);
    list = list.filter((p) => {
      const hay = [p.title, p.subtitle, p.category, p.sku, ...p.tags, ...p.colors.map((c) => c.name)].join(" ").toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }
  if (q.category?.length) list = list.filter((p) => q.category!.includes(p.category));
  if (q.minPrice != null) list = list.filter((p) => p.price >= q.minPrice! * 100);
  if (q.maxPrice != null) list = list.filter((p) => p.price <= q.maxPrice! * 100);
  if (q.rating) list = list.filter((p) => p.rating >= q.rating!);
  if (q.sizes?.length) list = list.filter((p) => q.sizes!.some((s) => (p.inventory[s] ?? 0) > 0));
  if (q.colors?.length) list = list.filter((p) => p.colors.some((c) => q.colors!.includes(c.name)));

  switch (q.sort) {
    case "price-asc":
      list.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      list.sort((a, b) => b.price - a.price);
      break;
    case "popular":
      list.sort((a, b) => b.sold - a.sold);
      break;
    case "rating":
      list.sort((a, b) => b.rating - a.rating);
      break;
    default:
      list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }
  const total = list.length;
  if (q.limit) list = list.slice(0, q.limit);
  return { total, items: list.map(toSummary) };
}

export function facets() {
  const db = getDb();
  const active = db.products.filter((p) => p.status === "active");
  const colors = new Map<string, string>();
  const sizes = new Set<string>();
  active.forEach((p) => {
    p.colors.forEach((c) => colors.set(c.name, c.hex));
    p.sizes.forEach((s) => sizes.add(s));
  });
  const prices = active.map((p) => p.price / 100);
  return {
    colors: Array.from(colors, ([name, hex]) => ({ name, hex })),
    sizes: Array.from(sizes),
    minPrice: Math.floor(Math.min(...prices)),
    maxPrice: Math.ceil(Math.max(...prices)),
  };
}

export { totalStock };
