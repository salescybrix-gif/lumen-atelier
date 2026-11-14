import { commit, getDb } from "@/lib/db";
import { error, json, requireAdmin } from "@/lib/auth";
import { totalStock } from "@/lib/utils";
import { parseProductInput } from "@/lib/product-input";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const products = getDb()
    .products.slice()
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .map((p) => ({ ...p, stock: totalStock(p) }));
  return json({ products });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const body = await req.json().catch(() => ({}));
  const product = parseProductInput(body);
  if (typeof product === "string") return error(product);
  getDb().products.push(product);
  commit();
  return json({ product }, 201);
}
