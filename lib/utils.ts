import { clsx, type ClassValue } from "clsx";
import type { DeliveryMethod, Product, ProductSummary } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const LOCALE = "en-IN";
export const CURRENCY = "INR";

/** Formats an amount stored in paise (1/100 rupee) as Indian rupees, e.g. ₹1,24,900. */
export function formatPrice(paise: number, opts: { compact?: boolean } = {}) {
  const value = paise / 100;
  if (opts.compact && Math.abs(value) >= 1000) {
    // en-IN compact notation uses T (thousand), L (lakh) and Cr (crore).
    return new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency: CURRENCY,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) {
  return new Date(iso).toLocaleDateString(LOCALE, opts);
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function uid(prefix = "") {
  const rand = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  return prefix ? `${prefix}_${rand}` : rand;
}

export function totalStock(p: Pick<Product, "inventory">) {
  return Object.values(p.inventory).reduce((a, b) => a + b, 0);
}

export function toSummary(p: Product): ProductSummary {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    subtitle: p.subtitle,
    price: p.price,
    compareAt: p.compareAt,
    category: p.category,
    images: p.images,
    colors: p.colors,
    sizes: p.sizes,
    rating: p.rating,
    reviewCount: p.reviewCount,
    tags: p.tags,
    createdAt: p.createdAt,
    inventory: p.inventory,
    stock: totalStock(p),
  };
}

export const DELIVERY_METHODS: DeliveryMethod[] = [
  { id: "standard", label: "Standard", eta: "4–6 business days", price: 0 },
  { id: "express", label: "Express", eta: "2–3 business days", price: 49900 },
  { id: "overnight", label: "Next day", eta: "Next business day (metro cities)", price: 99900 },
];

/** All money values are in paise. */
export const TAX_RATE = 0.12; // GST
export const FREE_SHIPPING_THRESHOLD = 1500000; // ₹15,000
export const STANDARD_SHIPPING_FEE = 29900; // ₹299 below the threshold

export const INDIAN_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Odisha", "Puducherry", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

/** Luhn checksum — used by the mock payment gateway to validate card numbers. */
export function luhn(num: string) {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 12) return false;
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

export function cardBrand(num: string) {
  const n = num.replace(/\D/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^(508|60|65|81|82|353|356)/.test(n)) return "RuPay";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^6(011|5)/.test(n)) return "Discover";
  return "Card";
}

/** UPI virtual payment address, e.g. name@okhdfcbank. */
export const UPI_ID_RE = /^[a-z0-9.\-_]{2,256}@[a-z][a-z0-9]{1,63}$/i;

/** aarav.mehta@okhdfcbank -> aa••••ta@okhdfcbank (store only a masked ID). */
export function maskUpiId(id: string) {
  const [user, handle] = id.split("@");
  const visible = user.length <= 4 ? user.slice(0, 1) : `${user.slice(0, 2)}••••${user.slice(-2)}`;
  return `${user.length <= 4 ? visible + "•••" : visible}@${handle}`;
}

/** Human label for how an order was paid. */
export function paymentLabel(p: { method?: string; brand: string; last4: string; upiId?: string }) {
  return p.method === "upi" ? `UPI · ${p.upiId}` : `${p.brand} ending ${p.last4}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
