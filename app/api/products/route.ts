import { facets, queryProducts } from "@/lib/db";
import { json } from "@/lib/auth";
import type { ProductQuery } from "@/types";

export const dynamic = "force-dynamic";

const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : undefined);
const num = (v: string | null) => (v != null && v !== "" && !isNaN(Number(v)) ? Number(v) : undefined);

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const query: ProductQuery = {
    q: sp.get("q") ?? undefined,
    category: list(sp.get("category")),
    minPrice: num(sp.get("min")),
    maxPrice: num(sp.get("max")),
    rating: num(sp.get("rating")),
    sizes: list(sp.get("sizes")),
    colors: list(sp.get("colors")),
    sort: (sp.get("sort") as ProductQuery["sort"]) ?? undefined,
    limit: num(sp.get("limit")),
  };
  const result = queryProducts(query);
  return json({ ...result, facets: sp.get("facets") ? facets() : undefined });
}
