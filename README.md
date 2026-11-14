# Lumen Atelier — Premium E‑commerce (Next.js 14)

A complete, production-style storefront and admin dashboard: minimalist luxury design, light/dark themes,
JWT auth with role-based access, a mock JSON database, India localisation (INR pricing with GST, Indian addresses, PIN codes and carriers), cart/checkout with a mock payment gateway, and an
analytics-driven admin panel. It runs fully offline: product imagery is generated as SVG on the server.

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14 App Router, React 18, TypeScript (strict) |
| Styling | Tailwind CSS 3 with CSS-variable design tokens (light + dark), glassmorphism, Tailwind keyframe animations |
| State | Zustand: `cart` and `wishlist` (persisted to localStorage), `session`, `ui` (toasts, quick view) |
| Auth | Email/password with `bcryptjs` hashing; HS256 JWT (`jose`) in an httpOnly cookie; middleware RBAC |
| Data | JSON-file mock DB (`.data/db.json`), seeded on first request; isolated behind `lib/db.ts` |
| Icons | `lucide-react` |
| Charts | Hand-written SVG (no chart library) |

## Getting started

Requirements: **Node.js 18.17+** (20 LTS recommended).

```bash
npm install
cp .env.example .env.local   # optional — set AUTH_SECRET
npm run dev
```

Open http://localhost:3000. The database seeds itself on the first request (16 products, 24 users,
~260 orders spread across the past year, reviews and traffic data for analytics).

Production build:

```bash
npm run build
npm start
```

Reset all data back to the seed:

```bash
npm run db:reset
```

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@lumen.test` | `admin123` |
| Customer | `demo@lumen.test` | `demo123` |

The sign-in page has one-click buttons that fill these in. Other seeded customers use `customer123`.

### Mock payment gateway

| Card | Result |
|---|---|
| `4242 4242 4242 4242` | Approved |
| `4000 0000 0000 0002` | Declined |

Any future expiry and any 3-digit CVC. Card numbers are Luhn-validated server-side; only brand + last four are stored (Visa, Mastercard, RuPay and Amex are recognised).

**UPI** (the default at checkout) is mocked too:

| UPI | Result |
|---|---|
| Any valid UPI ID, e.g. `demo@okhdfcbank` | Approved after a short "waiting for approval" step |
| `fail@upi` | Declined |
| **Scan QR** tab | Approved (the QR is decorative, not scannable) |

Only a masked UPI ID (e.g. `aa••••ta@okhdfcbank`) is stored on the order.

### Localisation (India)

- Prices are stored in **paise** and shown as INR with Indian digit grouping (₹1,24,900; compact ₹1.2L / ₹1.9Cr in admin).
- GST 12% on the subtotal; complimentary standard shipping over ₹15,000, otherwise ₹299; Express ₹499; Next day ₹999.
- Checkout uses an Indian state dropdown and validates 6-digit PIN codes (client and server).
- Seeded customers, addresses (Mumbai, Bengaluru, Delhi…) and carriers (Delhivery, Blue Dart, DTDC, India Post) are Indian.
- All of this lives in `lib/utils.ts` (`LOCALE`, `CURRENCY`, `TAX_RATE`, thresholds, `INDIAN_STATES`) and `lib/seed.ts`.

## How to test

**Storefront**
1. Home: hover a product card to see the image switch; click the heart (wishlist) or **Quick view**.
2. Search: type in the header search ("cash", "tote", "fig") for live suggestions; use ↑/↓ and Enter.
3. `/shop`: filter by category, price, rating, size, colour; change the sort; filters sync to the URL.
4. Product page: pick thumbnails, hover the main image to zoom, choose colour and size (low-stock sizes show an amber dot; sold-out sizes are struck through), add to bag or **Buy now**.
5. Bag drawer: change quantities, watch the free-shipping progress bar.
6. Checkout: three steps (information → delivery → payment), then the order confirmation page with invoice and tracking number.
7. Sign in as the demo customer → `/account`: order history with tracking timeline, addresses, saved cards, wishlist, settings. Write a review on a product you've bought to get the **Verified buyer** badge.

**Admin** (sign in as admin → `/admin`)
1. Overview: KPI cards with period-over-period deltas, revenue chart (7 days / 30 days / 12 months, hover for values), sales by category, recent orders with inline status dropdowns, top products, low-stock alerts.
2. Products: search/filter, **Add product** (upload images by click or drag-and-drop, or generate studio renders), edit, archive/restore, delete.
3. Orders: status tabs with counts, search, pagination; click a row for the detail modal to update tracking, change status (cancel restocks inventory) and process full or partial refunds.
4. Customers: lifetime spend, order counts, detail view with order history; deactivate/reactivate accounts (deactivated users can't sign in).

**Access control**: visiting `/admin` signed out redirects to `/login`; as a customer it redirects home with an "Admins only" toast. `/api/admin/*` returns 401/403, and every admin handler re-checks the role against the database.

## Project structure

```
app/
  (store)/              storefront route group (header, footer, cart drawer, quick view)
    page.tsx            homepage
    shop/               catalogue with filters
    product/[slug]/     product detail page
    checkout/           multi-step checkout
    order/[id]/         confirmation + invoice
    account/            customer dashboard
    login/, register/
  admin/                admin dashboard (overview, products, orders, customers)
  api/                  route handlers: auth, products, reviews, orders, account, admin/*, art
components/
  ui/                   primitives: Button, Input/Select/Textarea/Checkbox, Modal, Badge, Skeleton, Stars, Toaster
  layout/               Header, SearchBar, CartDrawer, Footer, Providers
  product/              ProductCard, QuickView, PurchasePanel, ProductGallery, Reviews
  shop/ checkout/ account/ order/ auth/ admin/
lib/
  db.ts                 JSON database + product queries (swap for Prisma here)
  seed.ts               deterministic seed data
  auth.ts, auth-edge.ts sessions, guards, JWT
  store/                Zustand stores
  art.ts                SVG product-image generator
types/                  shared TypeScript types
middleware.ts           route protection (RBAC)
```

## Moving to PostgreSQL + Prisma

All persistence goes through `lib/db.ts` (`getDb`, `commit`, `queryProducts`, `facets`). To move to a real
database, model the types in `types/index.ts` as Prisma models, replace those functions with Prisma queries,
and port `lib/seed.ts` to `prisma/seed.ts`. Route handlers and UI don't need to change shape.

## Production notes

- Set a strong `AUTH_SECRET`. Cookies are `secure` automatically in production.
- The JSON store is single-process and not meant for serverless or multi-instance deploys. Use a real database there.
- Replace the mock gateway in `app/api/orders/route.ts` with Stripe (Payment Intents) or similar; never send raw card numbers to your own server in production.
