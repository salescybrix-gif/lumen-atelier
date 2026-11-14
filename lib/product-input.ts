import { slugify } from "@/lib/utils";
import { uid } from "@/lib/utils";
import { CATEGORIES, type Product } from "@/types";

/** Validates and normalises an admin product payload. Shared by create and update. */
export function parseProductInput(body: Record<string, unknown>, existing?: Product): Product | string {
  const title = String(body.title ?? "").trim();
  if (title.length < 2) return "Title is required.";
  const price = Math.round(Number(body.price) * 100);
  if (!(price > 0)) return "Price must be greater than zero.";
  const category = String(body.category ?? "");
  if (!CATEGORIES.includes(category as Product["category"])) return "Choose a valid category.";
  const images = Array.isArray(body.images) ? (body.images as string[]).filter((s) => typeof s === "string" && s) : [];
  if (images.length === 0) return "Add at least one image.";
  const sizes = Array.isArray(body.sizes) && body.sizes.length ? (body.sizes as string[]).map(String) : ["One Size"];
  const invIn = (body.inventory ?? {}) as Record<string, number>;
  const inventory: Record<string, number> = {};
  sizes.forEach((s) => (inventory[s] = Math.max(0, Math.floor(Number(invIn[s] ?? 0)))));
  const compareAt = body.compareAt ? Math.round(Number(body.compareAt) * 100) : undefined;

  return {
    id: existing?.id ?? uid("prd"),
    slug: existing?.slug ?? `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`,
    sku: String(body.sku ?? "").trim() || existing?.sku || `LM-${category.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`,
    title,
    subtitle: String(body.subtitle ?? "").trim(),
    description: String(body.description ?? "").trim(),
    details: Array.isArray(body.details) ? (body.details as string[]).map(String).filter(Boolean) : existing?.details ?? [],
    price,
    compareAt: compareAt && compareAt > price ? compareAt : undefined,
    category: category as Product["category"],
    tags: Array.isArray(body.tags) ? (body.tags as string[]).map((t) => String(t).trim().toLowerCase()).filter(Boolean) : [],
    images,
    colors:
      Array.isArray(body.colors) && body.colors.length
        ? (body.colors as Product["colors"])
        : existing?.colors ?? [{ name: "Natural", hex: "#c8b393" }],
    sizes,
    inventory,
    rating: existing?.rating ?? 0,
    reviewCount: existing?.reviewCount ?? 0,
    sold: existing?.sold ?? 0,
    featured: !!body.featured,
    status: body.status === "archived" ? "archived" : "active",
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
}
