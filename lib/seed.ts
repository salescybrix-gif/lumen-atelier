import bcrypt from "bcryptjs";
import { artUrl } from "@/lib/art";
import { DELIVERY_METHODS, TAX_RATE, FREE_SHIPPING_THRESHOLD, maskUpiId, STANDARD_SHIPPING_FEE } from "@/lib/utils";
import type { Category, ColorOption, Database, Order, OrderStatus, Product, Review, User } from "@/types";

/**
 * Demo accounts (development only):
 *   Admin    admin@lumen.test / admin123
 *   Customer demo@lumen.test  / demo123
 */
export const DEMO_ACCOUNTS = {
  admin: { email: "admin@lumen.test", password: "admin123" },
  customer: { email: "demo@lumen.test", password: "demo123" },
};

// Deterministic PRNG so the seeded store looks the same on every reset.
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261114);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL"];
const ONE = ["One Size"];
const FRAG = ["50 ml", "100 ml"];

const C = {
  bone: { name: "Bone", hex: "#e4dccd" },
  sand: { name: "Sand", hex: "#c8b393" },
  camel: { name: "Camel", hex: "#a77b4f" },
  cognac: { name: "Cognac", hex: "#8a4b2a" },
  olive: { name: "Olive", hex: "#5d5f45" },
  slate: { name: "Slate", hex: "#58606a" },
  ink: { name: "Ink", hex: "#22252b" },
  noir: { name: "Noir", hex: "#1b1a19" },
  clay: { name: "Clay", hex: "#b2705a" },
  sage: { name: "Sage", hex: "#9aa58f" },
  amber: { name: "Amber", hex: "#c08a3e" },
  smoke: { name: "Smoke", hex: "#8f8a84" },
  ivory: { name: "Ivory", hex: "#efe8da" },
} satisfies Record<string, ColorOption>;

interface Def {
  title: string;
  subtitle: string;
  category: Category;
  price: number;
  compareAt?: number;
  colors: ColorOption[];
  tags: string[];
  description: string;
  details: string[];
  featured?: boolean;
}

const DEFS: Def[] = [
  {
    title: "Arden Wool Overcoat",
    subtitle: "Double-faced Italian wool",
    category: "Outerwear",
    price: 7490000,
    colors: [C.camel, C.noir, C.slate],
    tags: ["wool", "tailoring", "bestseller"],
    description:
      "A softly structured overcoat cut from double-faced Italian wool. Unlined for an impossibly light drape, with hand-finished seams and a relaxed shoulder that layers effortlessly over knitwear.",
    details: ["100% virgin wool, woven in Biella", "Unlined, hand-finished seams", "Horn buttons", "Dry clean only"],
    featured: true,
  },
  {
    title: "Orrin Trench",
    subtitle: "Water-repellent cotton gabardine",
    category: "Outerwear",
    price: 5490000,
    colors: [C.sand, C.olive],
    tags: ["cotton", "rainwear"],
    description:
      "A modern trench in tightly woven cotton gabardine, treated for water resistance. Clean lines, concealed placket and a detachable belt.",
    details: ["100% organic cotton gabardine", "PFC-free water repellency", "Concealed button placket", "Made in Portugal"],
  },
  {
    title: "Sil Quilted Liner",
    subtitle: "Recycled down alternative",
    category: "Outerwear",
    price: 3290000,
    compareAt: 3890000,
    colors: [C.ink, C.sage],
    tags: ["layering", "sale"],
    description: "A featherlight quilted liner designed to be worn alone or beneath our coats. Diamond quilting, snap front and a collarless neckline.",
    details: ["Recycled nylon shell", "Recycled synthetic fill", "Snap closure", "Machine wash cold"],
  },
  {
    title: "Halden Cashmere Crew",
    subtitle: "Grade-A Mongolian cashmere",
    category: "Knitwear",
    price: 3490000,
    colors: [C.ivory, C.smoke, C.ink, C.camel],
    tags: ["cashmere", "bestseller"],
    description:
      "Twelve-gauge cashmere knitted into a relaxed crew neck. Fully fashioned for a clean silhouette that gets softer with every wear.",
    details: ["100% grade-A cashmere", "12-gauge knit", "Fully fashioned", "Hand wash cold"],
    featured: true,
  },
  {
    title: "Mira Rib Cardigan",
    subtitle: "Merino and silk blend",
    category: "Knitwear",
    price: 2890000,
    colors: [C.bone, C.clay],
    tags: ["merino", "silk"],
    description: "A fine-rib cardigan in a merino-silk blend with mother-of-pearl buttons. Fitted through the body with a slightly cropped length.",
    details: ["70% merino, 30% silk", "Mother-of-pearl buttons", "Rib knit", "Hand wash cold"],
  },
  {
    title: "Fen Fisherman Sweater",
    subtitle: "Undyed British wool",
    category: "Knitwear",
    price: 2490000,
    colors: [C.ivory, C.olive],
    tags: ["wool", "heritage"],
    description: "A heavy-gauge fisherman knit spun from undyed British wool. Textural cable work and a generous, boxy fit.",
    details: ["100% British wool", "Heavy 5-gauge knit", "Undyed natural fibres", "Hand wash cold"],
  },
  {
    title: "Vale Leather Tote",
    subtitle: "Vegetable-tanned calfskin",
    category: "Bags",
    price: 8290000,
    colors: [C.cognac, C.noir, C.sand],
    tags: ["leather", "bestseller", "everyday"],
    description:
      "An architectural tote in vegetable-tanned calfskin that develops a rich patina over time. Unlined interior with a detachable zip pouch.",
    details: ["Vegetable-tanned Italian calfskin", "Fits a 16\" laptop", "Detachable zip pouch", "Made in Florence"],
    featured: true,
  },
  {
    title: "Nove Crossbody",
    subtitle: "Pebbled leather, brushed brass",
    category: "Bags",
    price: 4690000,
    colors: [C.noir, C.clay],
    tags: ["leather", "evening"],
    description: "A compact crossbody with an adjustable strap and magnetic closure. Sized for the essentials with a single interior card slot.",
    details: ["Pebbled calfskin", "Brushed brass hardware", "Adjustable strap", "Made in Spain"],
  },
  {
    title: "Ostra Weekender",
    subtitle: "Waxed canvas & leather",
    category: "Bags",
    price: 5990000,
    compareAt: 6990000,
    colors: [C.olive, C.ink],
    tags: ["travel", "canvas", "sale"],
    description: "A generous weekender in waxed cotton canvas, trimmed in full-grain leather. Fits three days of packing and stows under any seat.",
    details: ["Waxed cotton canvas", "Full-grain leather trims", "45L capacity", "Cabin-friendly"],
  },
  {
    title: "No. 04 Cèdre",
    subtitle: "Eau de parfum — cedar, iris, smoke",
    category: "Fragrance",
    price: 1790000,
    colors: [C.amber],
    tags: ["woody", "bestseller"],
    description: "A quiet, woody composition. Atlas cedar meets powdery orris and a breath of birch smoke, drying down to a soft skin musk.",
    details: ["Top: bergamot, pink pepper", "Heart: iris, violet leaf", "Base: Atlas cedar, birch tar, musk", "Made in Grasse"],
    featured: true,
  },
  {
    title: "No. 07 Figue",
    subtitle: "Eau de parfum — fig leaf, milk, sandalwood",
    category: "Fragrance",
    price: 1790000,
    colors: [C.sage],
    tags: ["green", "new"],
    description: "Sun-warmed fig leaves, crushed green stems and a creamy sandalwood heart. Bright, milky and impossibly calm.",
    details: ["Top: fig leaf, cassis", "Heart: fig milk, jasmine", "Base: sandalwood, cashmeran", "Made in Grasse"],
  },
  {
    title: "No. 11 Ambre Nuit",
    subtitle: "Extrait — amber, labdanum, vanilla",
    category: "Fragrance",
    price: 2190000,
    colors: [C.cognac],
    tags: ["amber", "evening"],
    description: "A resinous extrait de parfum: warm labdanum and benzoin wrapped in smoked vanilla. Long-lasting and intimate.",
    details: ["Top: saffron, mandarin", "Heart: labdanum, rose", "Base: benzoin, vanilla, oud accord", "Made in Grasse"],
  },
  {
    title: "Kiln Stoneware Vase",
    subtitle: "Hand-thrown, reactive glaze",
    category: "Objects",
    price: 1490000,
    colors: [C.bone, C.slate, C.clay],
    tags: ["ceramic", "handmade"],
    description: "A hand-thrown stoneware vase finished in a reactive glaze, so every piece is unique. Watertight and made for single stems or dried branches.",
    details: ["Hand-thrown stoneware", "Reactive glaze — each piece unique", "H 28cm", "Made in Japan"],
    featured: true,
  },
  {
    title: "Ember Travertine Candle",
    subtitle: "Smoked oak, 60-hour burn",
    category: "Objects",
    price: 990000,
    colors: [C.sand],
    tags: ["candle", "gift"],
    description: "Coconut and rapeseed wax poured into a honed travertine vessel. Notes of smoked oak, black tea and leather. Reuse the vessel long after.",
    details: ["60-hour burn time", "Coconut-rapeseed wax", "Honed travertine vessel", "Cotton wick"],
  },
  {
    title: "Lune Glass Carafe",
    subtitle: "Mouth-blown borosilicate",
    category: "Objects",
    price: 790000,
    colors: [C.smoke, C.amber],
    tags: ["glass", "new", "gift"],
    description: "A mouth-blown carafe with a tumbler that doubles as a lid. Thin-walled, featherlight and dishwasher safe.",
    details: ["Borosilicate glass", "1L capacity", "Tumbler lid", "Dishwasher safe"],
  },
  {
    title: "Asha Linen Throw",
    subtitle: "Stonewashed Belgian linen",
    category: "Objects",
    price: 1890000,
    compareAt: 2190000,
    colors: [C.sage, C.bone],
    tags: ["linen", "sale"],
    description: "A heavyweight throw in stonewashed Belgian linen with a hand-knotted fringe. Softens beautifully with every wash.",
    details: ["100% Belgian linen", "130 × 180cm", "Hand-knotted fringe", "Machine wash warm"],
  },
];

const FIRST = ["Aarav", "Diya", "Vihaan", "Ananya", "Arjun", "Isha", "Kabir", "Meera", "Rohan", "Saanvi", "Aditya", "Priya", "Ishaan", "Kavya", "Reyansh", "Nisha", "Vikram", "Tara", "Siddharth", "Aisha"];
const LAST = ["Sharma", "Iyer", "Mehta", "Reddy", "Kapoor", "Nair", "Banerjee", "Gupta", "Desai", "Menon", "Chopra", "Rao", "Singh", "Joshi", "Pillai"];
// [city, state, PIN code, street/locality]
const CITIES = [
  ["Mumbai", "Maharashtra", "400050", "Hill Road, Bandra West"],
  ["Bengaluru", "Karnataka", "560038", "100 Feet Road, Indiranagar"],
  ["New Delhi", "Delhi", "110016", "Aurobindo Marg, Hauz Khas"],
  ["Hyderabad", "Telangana", "500034", "Road No. 12, Banjara Hills"],
  ["Chennai", "Tamil Nadu", "600028", "TTK Road, Alwarpet"],
  ["Pune", "Maharashtra", "411001", "East Street, Camp"],
  ["Kolkata", "West Bengal", "700019", "Ballygunge Circular Road"],
  ["Ahmedabad", "Gujarat", "380015", "Judges Bungalow Road, Bodakdev"],
  ["Jaipur", "Rajasthan", "302001", "MI Road, C-Scheme"],
  ["Gurugram", "Haryana", "122002", "Golf Course Road, DLF Phase 5"],
];
const REVIEW_TITLES = [
  ["Exceptional quality", "Worth every penny. The materials feel incredible and the finish is flawless."],
  ["Beautifully made", "You can tell real care went into this. Fits true to size and looks even better in person."],
  ["My new favourite", "I've reached for this almost every day since it arrived. Packaging was gorgeous too."],
  ["Lovely, runs a touch large", "Quality is superb. I'd size down if you're between sizes."],
  ["Understated luxury", "Exactly the quiet, refined piece I was looking for. Compliments every time."],
  ["Good, not perfect", "Gorgeous piece but delivery took a little longer than expected."],
  ["Timeless", "This will last for years. The colour is rich and true to the photos."],
];

const DAY = 86400000;
const iso = (t: number) => new Date(t).toISOString();

export function buildSeed(): Database {
  const now = Date.now();
  const hash = (pw: string) => bcrypt.hashSync(pw, 8);

  // ---------- Users ----------
  const users: User[] = [
    {
      id: "usr_admin",
      name: "Ananya Iyer",
      email: DEMO_ACCOUNTS.admin.email,
      passwordHash: hash(DEMO_ACCOUNTS.admin.password),
      role: "admin",
      active: true,
      createdAt: iso(now - 400 * DAY),
      addresses: [],
      paymentMethods: [],
    },
    {
      id: "usr_demo",
      name: "Aarav Mehta",
      email: DEMO_ACCOUNTS.customer.email,
      passwordHash: hash(DEMO_ACCOUNTS.customer.password),
      role: "customer",
      active: true,
      createdAt: iso(now - 220 * DAY),
      addresses: [
        {
          id: "adr_demo1",
          label: "Home",
          fullName: "Aarav Mehta",
          line1: "Flat 12B, Sea Breeze Apartments",
          line2: "Carter Road, Bandra West",
          city: "Mumbai",
          region: "Maharashtra",
          postalCode: "400050",
          country: "India",
          phone: "+91 98200 12345",
          isDefault: true,
        },
        {
          id: "adr_demo2",
          label: "Studio",
          fullName: "Aarav Mehta",
          line1: "3rd Floor, 80 Feet Road",
          line2: "Koramangala 4th Block",
          city: "Bengaluru",
          region: "Karnataka",
          postalCode: "560034",
          country: "India",
          phone: "+91 98200 12345",
        },
      ],
      paymentMethods: [{ id: "pm_demo1", brand: "Visa", last4: "4242", expMonth: 8, expYear: 2029, holder: "Aarav Mehta", isDefault: true }],
    },
  ];
  const customerPw = hash("customer123");
  for (let i = 0; i < 22; i++) {
    const first = FIRST[i % FIRST.length];
    const last = pick(LAST);
    const [city, region, postalCode, street] = pick(CITIES);
    users.push({
      id: `usr_${(i + 1).toString().padStart(3, "0")}`,
      name: `${first} ${last}`,
      email: `${first}.${last}`.toLowerCase() + "@example.com",
      passwordHash: customerPw,
      role: "customer",
      active: rand() > 0.06,
      createdAt: iso(now - between(5, 380) * DAY),
      addresses: [
        {
          id: `adr_${i + 1}`,
          label: "Home",
          fullName: `${first} ${last}`,
          line1: `${between(1, 220)}, ${pick(["Shanti Kunj", "Lakeview Residency", "Palm Grove", "Silver Oak Towers", "Green Park Villas"])}`,
          line2: street,
          city,
          region,
          postalCode,
          country: "India",
          phone: `+91 9${between(100000000, 999999999)}`.replace(/^(\+91 \d{5})/, "$1 "),
          isDefault: true,
        },
      ],
      paymentMethods: [],
    });
  }

  // ---------- Products ----------
  const products: Product[] = DEFS.map((d, i) => {
    const sizes = d.category === "Outerwear" || d.category === "Knitwear" ? APPAREL_SIZES : d.category === "Fragrance" ? FRAG : ONE;
    const inventory: Record<string, number> = {};
    sizes.forEach((s) => (inventory[s] = between(0, 4) === 0 ? between(0, 3) : between(6, 40)));
    const primary = d.colors[0].hex;
    const images = [0, 1, 2].map((v) => artUrl(d.category, primary, v));
    if (d.colors[1]) images.push(artUrl(d.category, d.colors[1].hex, 1));
    const slug = d.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return {
      id: `prd_${(i + 1).toString().padStart(3, "0")}`,
      slug,
      sku: `LM-${d.category.slice(0, 3).toUpperCase()}-${(1001 + i * 7).toString()}`,
      title: d.title,
      subtitle: d.subtitle,
      description: d.description,
      details: d.details,
      price: d.price,
      compareAt: d.compareAt,
      category: d.category,
      tags: d.tags,
      images,
      colors: d.colors,
      sizes,
      inventory,
      rating: 0,
      reviewCount: 0,
      sold: 0,
      featured: !!d.featured,
      status: "active",
      createdAt: iso(now - (DEFS.length - i) * 9 * DAY - between(0, 5) * DAY),
    };
  });

  // ---------- Orders ----------
  const customers = users.filter((u) => u.role === "customer");
  const orders: Order[] = [];
  const statusFor = (ageDays: number): OrderStatus => {
    const r = rand();
    if (r < 0.04) return "cancelled";
    if (r < 0.06) return "refunded";
    if (ageDays < 2) return "pending";
    if (ageDays < 4) return "processing";
    if (ageDays < 8) return "shipped";
    return "delivered";
  };

  const ORDER_COUNT = 260;
  for (let i = 0; i < ORDER_COUNT; i++) {
    // Skew toward recent dates and simulate growth.
    const ageDays = Math.floor(Math.pow(rand(), 1.4) * 365);
    const createdAt = now - ageDays * DAY - between(0, 23) * 3600000;
    const user = i < 6 ? customers[0] : pick(customers);
    const home = user.addresses[0];
    const [city, region, postalCode, street] = home ? [home.city, home.region, home.postalCode, home.line2 ?? ""] : pick(CITIES);
    const line1 = home ? home.line1 : `${between(1, 220)}, ${street}`;
    const itemCount = rand() < 0.65 ? 1 : rand() < 0.8 ? 2 : 3;
    const items = Array.from({ length: itemCount }, () => {
      const p = products[Math.floor(Math.pow(rand(), 1.3) * products.length)];
      const color = pick(p.colors);
      return {
        productId: p.id,
        slug: p.slug,
        title: p.title,
        image: p.images[0],
        category: p.category,
        size: pick(p.sizes),
        color: color.name,
        price: p.price,
        qty: rand() < 0.88 ? 1 : 2,
      };
    });
    const subtotal = items.reduce((a, it) => a + it.price * it.qty, 0);
    const delivery = rand() < 0.7 ? DELIVERY_METHODS[0] : pick(DELIVERY_METHODS.slice(1));
    const shipping = delivery.id === "standard" && subtotal < FREE_SHIPPING_THRESHOLD ? STANDARD_SHIPPING_FEE : delivery.price;
    const tax = Math.round(subtotal * TAX_RATE);
    const status = statusFor(ageDays);
    const total = subtotal + shipping + tax;
    const flow: OrderStatus[] = ["pending", "processing", "shipped", "delivered"];
    const history = [] as Order["history"];
    if (status === "cancelled") {
      history.push({ status: "pending", at: iso(createdAt) }, { status: "cancelled", at: iso(createdAt + 0.4 * DAY), note: "Cancelled at customer request" });
    } else if (status === "refunded") {
      flow.forEach((s, k) => history.push({ status: s, at: iso(createdAt + k * 1.6 * DAY) }));
      history.push({ status: "refunded", at: iso(createdAt + 9 * DAY), note: "Returned within 30 days" });
    } else {
      flow.slice(0, flow.indexOf(status) + 1).forEach((s, k) => history.push({ status: s, at: iso(createdAt + k * 1.6 * DAY) }));
    }
    const shipped = ["shipped", "delivered", "refunded"].includes(status);
    orders.push({
      id: `ord_${(i + 1).toString(36)}${Math.floor(rand() * 1e6).toString(36)}`,
      number: `LM-${(100481 + i).toString()}`,
      userId: user.id,
      email: user.email,
      customerName: user.name,
      items,
      shippingAddress: { fullName: user.name, line1, line2: home?.line2, city, region, postalCode, country: "India", phone: home?.phone },
      delivery,
      // UPI dominates Indian online payments, so most seeded orders use it.
      payment:
        rand() < 0.55
          ? { method: "upi", brand: "UPI", last4: "", upiId: maskUpiId(`${user.name.split(" ")[0].toLowerCase()}${between(10, 99)}@${pick(["okhdfcbank", "okicici", "oksbi", "ybl", "paytm"])}`) }
          : { method: "card", brand: pick(["Visa", "Mastercard", "RuPay"]), last4: between(1000, 9999).toString() },
      subtotal,
      shipping,
      tax,
      total,
      refunded: status === "refunded" ? total : 0,
      status,
      carrier: shipped ? pick(["Delhivery", "Blue Dart", "DTDC", "India Post"]) : "",
      trackingNumber: shipped ? `DLV${Math.floor(rand() * 1e10).toString().padStart(10, "0")}IN` : "",
      history,
      createdAt: iso(createdAt),
    });
    if (status !== "cancelled" && status !== "refunded") {
      items.forEach((it) => {
        const p = products.find((x) => x.id === it.productId)!;
        p.sold += it.qty;
      });
    }
  }
  orders.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  // ---------- Reviews ----------
  const reviews: Review[] = [];
  products.forEach((p) => {
    const n = between(3, 9);
    for (let k = 0; k < n; k++) {
      const r = rand();
      const rating = r < 0.55 ? 5 : r < 0.85 ? 4 : r < 0.95 ? 3 : 2;
      const [title, body] = rating <= 3 ? REVIEW_TITLES[rand() < 0.5 ? 3 : 5] : pick(REVIEW_TITLES.filter((_, idx) => idx !== 3 && idx !== 5));
      const author = pick(customers);
      reviews.push({
        id: `rev_${p.id}_${k}`,
        productId: p.id,
        userId: author.id,
        author: `${author.name.split(" ")[0]} ${author.name.split(" ")[1][0]}.`,
        rating,
        title,
        body,
        verified: rand() > 0.2,
        createdAt: iso(now - between(1, 200) * DAY),
      });
    }
    const mine = reviews.filter((x) => x.productId === p.id);
    p.reviewCount = mine.length;
    p.rating = Math.round((mine.reduce((a, x) => a + x.rating, 0) / mine.length) * 10) / 10;
  });

  // ---------- Visits (for conversion rate) ----------
  const visits: Record<string, number> = {};
  for (let d = 0; d < 400; d++) {
    const key = iso(now - d * DAY).slice(0, 10);
    const ordersThatDay = orders.filter((o) => o.createdAt.slice(0, 10) === key).length;
    visits[key] = ordersThatDay * between(28, 40) + between(15, 60);
  }

  return { version: 1, users, products, reviews, orders, visits };
}
