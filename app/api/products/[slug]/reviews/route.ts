import { commit, getDb } from "@/lib/db";
import { error, json, requireUser } from "@/lib/auth";
import { uid } from "@/lib/utils";
import type { Review } from "@/types";

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { user } = auth.ctx;

  const body = await req.json().catch(() => ({}));
  const rating = Math.round(Number(body.rating));
  const title = String(body.title ?? "").trim();
  const text = String(body.body ?? "").trim();
  if (!(rating >= 1 && rating <= 5)) return error("Please choose a rating from 1 to 5.");
  if (title.length < 2 || text.length < 10) return error("Please add a title and at least 10 characters of feedback.");

  const db = getDb();
  const product = db.products.find((p) => p.slug === params.slug);
  if (!product) return error("Product not found.", 404);

  const verified = db.orders.some(
    (o) => o.userId === user.id && o.status !== "cancelled" && o.items.some((i) => i.productId === product.id)
  );
  const [first, last = ""] = user.name.split(" ");
  const review: Review = {
    id: uid("rev"),
    productId: product.id,
    userId: user.id,
    author: `${first} ${last ? last[0] + "." : ""}`.trim(),
    rating,
    title,
    body: text,
    verified,
    createdAt: new Date().toISOString(),
  };
  db.reviews.push(review);
  const all = db.reviews.filter((r) => r.productId === product.id);
  product.reviewCount = all.length;
  product.rating = Math.round((all.reduce((a, r) => a + r.rating, 0) / all.length) * 10) / 10;
  commit();
  return json({ review }, 201);
}
