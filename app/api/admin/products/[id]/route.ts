import { commit, getDb } from "@/lib/db";
import { error, json, requireAdmin } from "@/lib/auth";
import { parseProductInput } from "@/lib/product-input";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const db = getDb();
  const idx = db.products.findIndex((p) => p.id === params.id);
  if (idx < 0) return error("Product not found.", 404);
  const body = await req.json().catch(() => ({}));

  // Lightweight status toggle (archive / restore).
  if (Object.keys(body).length === 1 && "status" in body) {
    db.products[idx].status = body.status === "archived" ? "archived" : "active";
  } else {
    const updated = parseProductInput(body, db.products[idx]);
    if (typeof updated === "string") return error(updated);
    db.products[idx] = updated;
  }
  commit();
  return json({ product: db.products[idx] });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const db = getDb();
  const before = db.products.length;
  db.products = db.products.filter((p) => p.id !== params.id);
  if (db.products.length === before) return error("Product not found.", 404);
  db.reviews = db.reviews.filter((r) => r.productId !== params.id);
  commit();
  return json({ ok: true });
}
