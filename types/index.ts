export type Role = "customer" | "admin";

export type Category = "Outerwear" | "Knitwear" | "Bags" | "Fragrance" | "Objects";
export const CATEGORIES: Category[] = ["Outerwear", "Knitwear", "Bags", "Fragrance", "Objects"];

export interface ColorOption {
  name: string;
  hex: string;
}

export interface Review {
  id: string;
  productId: string;
  userId?: string;
  author: string;
  rating: number; // 1..5
  title: string;
  body: string;
  verified: boolean;
  createdAt: string;
}

export type ProductStatus = "active" | "archived";

export interface Product {
  id: string;
  slug: string;
  sku: string;
  title: string;
  subtitle: string;
  description: string;
  details: string[];
  price: number; // in cents
  compareAt?: number; // in cents
  category: Category;
  tags: string[];
  images: string[];
  colors: ColorOption[];
  sizes: string[];
  inventory: Record<string, number>; // size -> units
  rating: number;
  reviewCount: number;
  sold: number;
  featured: boolean;
  status: ProductStatus;
  createdAt: string;
}

/** Product as returned to the storefront (without heavy fields that aren't needed in lists). */
export type ProductSummary = Pick<
  Product,
  | "id"
  | "slug"
  | "title"
  | "subtitle"
  | "price"
  | "compareAt"
  | "category"
  | "images"
  | "colors"
  | "sizes"
  | "rating"
  | "reviewCount"
  | "tags"
  | "createdAt"
  | "inventory"
> & { stock: number };

export interface Address {
  id: string;
  label: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  holder: string;
  isDefault?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  active: boolean;
  createdAt: string;
  addresses: Address[];
  paymentMethods: PaymentMethod[];
}

export type PublicUser = Omit<User, "passwordHash">;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
export const ORDER_STATUSES: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"];

export interface OrderItem {
  productId: string;
  slug: string;
  title: string;
  image: string;
  category: Category;
  size: string;
  color: string;
  price: number;
  qty: number;
}

export type DeliveryMethodId = "standard" | "express" | "overnight";

export interface DeliveryMethod {
  id: DeliveryMethodId;
  label: string;
  eta: string;
  price: number;
}

export interface OrderEvent {
  status: OrderStatus;
  at: string;
  note?: string;
}

export interface Order {
  id: string;
  number: string;
  userId?: string;
  email: string;
  customerName: string;
  items: OrderItem[];
  shippingAddress: Omit<Address, "id" | "label" | "isDefault">;
  delivery: DeliveryMethod;
  /** Card: brand + last4. UPI: method "upi", brand "UPI", masked upiId. */
  payment: { method?: "card" | "upi"; brand: string; last4: string; upiId?: string };
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  refunded: number;
  status: OrderStatus;
  carrier: string;
  trackingNumber: string;
  history: OrderEvent[];
  createdAt: string;
}

export interface Database {
  version: number;
  users: User[];
  products: Product[];
  reviews: Review[];
  orders: Order[];
  /** ISO date (yyyy-mm-dd) -> storefront visits, used to compute conversion rate */
  visits: Record<string, number>;
}

export interface CartItem {
  key: string;
  productId: string;
  slug: string;
  title: string;
  image: string;
  category: Category;
  price: number;
  size: string;
  color: string;
  qty: number;
  maxQty: number;
}

export interface ProductQuery {
  q?: string;
  category?: string[];
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sizes?: string[];
  colors?: string[];
  sort?: "newest" | "popular" | "price-asc" | "price-desc" | "rating";
  limit?: number;
}
