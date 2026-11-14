"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, CreditCard, Heart, LogOut, MapPin, Package, Plus, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Checkbox } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge, EmptyState, Skeleton, StatusBadge } from "@/components/ui/misc";
import { ProductCard } from "@/components/product/ProductCard";
import { OrderTimeline } from "@/components/order/OrderTimeline";
import { useSession, post } from "@/lib/store/session";
import { useWishlist } from "@/lib/store/wishlist";
import { toast } from "@/lib/store/ui";
import { useMounted } from "@/lib/hooks";
import { cn, formatDate, formatPrice, initials } from "@/lib/utils";
import type { Address, Order, PublicUser } from "@/types";

const TABS = [
  { id: "orders", label: "Orders", icon: Package },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "payments", label: "Payment methods", icon: CreditCard },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "settings", label: "Settings", icon: Settings },
] as const;
type TabId = (typeof TABS)[number]["id"];

async function accountAction(body: Record<string, unknown>) {
  const { profile } = await post<{ profile: PublicUser }>("/api/account", body);
  useSession.getState().setProfile(profile);
  return profile;
}

export function AccountView() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, status, logout } = useSession();
  const tab = (TABS.find((t) => t.id === sp.get("tab"))?.id ?? "orders") as TabId;

  useEffect(() => {
    if (status === "ready" && !user) router.replace("/login?next=/account");
  }, [status, user, router]);

  if (status === "loading" || !profile) {
    return (
      <div className="container-x py-14">
        <Skeleton className="h-12 w-72" />
        <div className="mt-10 grid gap-10 lg:grid-cols-[240px_1fr]">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x py-10 lg:py-14">
      <div className="flex flex-wrap items-center gap-5">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-ink font-serif text-2xl text-canvas">{initials(profile.name)}</span>
        <div>
          <p className="eyebrow">My account</p>
          <h1 className="display mt-1 text-4xl sm:text-5xl">Hello, {profile.name.split(" ")[0]}</h1>
        </div>
        {profile.role === "admin" && (
          <Button href="/admin" variant="outline" size="sm" className="ml-auto">
            Admin dashboard
          </Button>
        )}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[240px_1fr] lg:gap-14">
        <nav className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => router.replace(`${pathname}?tab=${id}`, { scroll: false })}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm transition lg:rounded-xl",
                tab === id ? "bg-ink text-canvas" : "text-ink/75 hover:bg-sunken hover:text-ink"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
          <button
            onClick={async () => {
              await logout();
              router.push("/");
            }}
            className="flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm text-muted transition hover:bg-sunken lg:mt-4 lg:rounded-xl"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </nav>

        <div key={tab} className="min-w-0 animate-fade-in">
          {tab === "orders" && <OrdersTab />}
          {tab === "addresses" && <AddressesTab profile={profile} />}
          {tab === "payments" && <PaymentsTab profile={profile} />}
          {tab === "wishlist" && <WishlistTab />}
          {tab === "settings" && <SettingsTab profile={profile} />}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Orders ---------------- */
function OrdersTab() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/orders", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders ?? []);
        if (d.orders?.[0]) setOpen(d.orders[0].id);
      });
  }, []);

  if (!orders)
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  if (orders.length === 0)
    return <EmptyState icon={<Package className="h-6 w-6" />} title="No orders yet" body="When you place an order, you can track it here." action={<Button href="/shop">Start shopping</Button>} />;

  return (
    <div>
      <SectionTitle title="Order history" sub={`${orders.length} orders`} />
      <ul className="space-y-4">
        {orders.map((o) => {
          const expanded = open === o.id;
          return (
            <li key={o.id} className="card overflow-hidden">
              <button onClick={() => setOpen(expanded ? null : o.id)} className="flex w-full flex-wrap items-center gap-4 p-5 text-left sm:flex-nowrap sm:p-6">
                <div className="flex -space-x-3">
                  {o.items.slice(0, 3).map((i, k) => (
                    <img key={k} src={i.image} alt="" className="h-14 w-11 rounded-lg border-2 border-surface object-cover" />
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{o.number}</p>
                  <p className="text-xs text-muted">
                    {formatDate(o.createdAt)} · {o.items.reduce((n, i) => n + i.qty, 0)} items
                  </p>
                </div>
                <StatusBadge status={o.status} />
                <span className="w-24 text-right text-sm tabular-nums">{formatPrice(o.total)}</span>
                <ChevronDown className={cn("h-4 w-4 text-muted transition", expanded && "rotate-180")} />
              </button>
              {expanded && (
                <div className="animate-fade-in border-t border-line p-5 sm:p-6">
                  <OrderTimeline order={o} />
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-sunken px-4 py-3 text-xs">
                    <span>
                      <span className="text-muted">Tracking:</span>{" "}
                      <span className="font-mono">{o.trackingNumber ? `${o.carrier} ${o.trackingNumber}` : "Assigned when shipped"}</span>
                    </span>
                    <Link href={`/order/${o.id}`} className="font-medium underline underline-offset-4">
                      View invoice
                    </Link>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------------- Addresses ---------------- */
const blankAddress: Address = { id: "", label: "", fullName: "", line1: "", line2: "", city: "", region: "", postalCode: "", country: "India", phone: "" };

function AddressesTab({ profile }: { profile: PublicUser }) {
  const [editing, setEditing] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await accountAction({ action: "saveAddress", address: editing });
      toast({ title: "Address saved", tone: "success" });
      setEditing(null);
    } catch (err) {
      toast({ title: (err as Error).message, tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <SectionTitle title="Saved addresses" action={<Button size="sm" onClick={() => setEditing({ ...blankAddress, fullName: profile.name })}><Plus className="h-4 w-4" /> Add address</Button>} />
      {profile.addresses.length === 0 ? (
        <EmptyState icon={<MapPin className="h-6 w-6" />} title="No saved addresses" body="Save an address for a faster checkout." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {profile.addresses.map((a) => (
            <div key={a.id} className="card flex flex-col p-6">
              <div className="flex items-center justify-between">
                <p className="font-medium">{a.label}</p>
                {a.isDefault && <Badge tone="dark">Default</Badge>}
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                {a.fullName}
                <br />
                {a.line1}
                {a.line2 && `, ${a.line2}`}
                <br />
                {a.city}, {a.region} {a.postalCode}
                <br />
                {a.country}
              </p>
              <div className="mt-5 flex gap-4 text-xs">
                <button className="underline underline-offset-4" onClick={() => setEditing(a)}>Edit</button>
                {!a.isDefault && (
                  <button className="text-muted hover:text-ink" onClick={() => accountAction({ action: "setDefault", kind: "address", id: a.id }).then(() => toast({ title: "Default address updated" }))}>
                    Set as default
                  </button>
                )}
                <button className="ml-auto text-muted hover:text-danger" onClick={() => accountAction({ action: "deleteAddress", id: a.id }).then(() => toast({ title: "Address removed" }))} aria-label="Delete address">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit address" : "New address"} size="md">
        {editing && (
          <form onSubmit={save} className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
            {(
              [
                ["label", "Label (e.g. Home)", 2],
                ["fullName", "Full name", 2],
                ["line1", "Address", 2],
                ["line2", "Apartment, suite (optional)", 2],
                ["city", "City", 1],
                ["region", "State", 1],
                ["postalCode", "PIN code", 1],
                ["country", "Country", 1],
                ["phone", "Phone (optional)", 2],
              ] as const
            ).map(([k, label, span]) => (
              <Input
                key={k}
                wrapClassName={span === 2 ? "sm:col-span-2" : ""}
                label={label}
                value={(editing[k] as string) ?? ""}
                onChange={(e) => setEditing({ ...editing, [k]: e.target.value })}
                required={!label.includes("optional") && k !== "label"}
              />
            ))}
            <Checkbox className="sm:col-span-2" label="Set as default address" checked={!!editing.isDefault} onChange={(e) => setEditing({ ...editing, isDefault: e.target.checked })} />
            <div className="flex justify-end gap-3 sm:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" loading={saving}>Save address</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

/* ---------------- Payments ---------------- */
function PaymentsTab({ profile }: { profile: PublicUser }) {
  const [adding, setAdding] = useState(false);
  const [card, setCard] = useState({ number: "", exp: "", name: profile.name });
  const [saving, setSaving] = useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await accountAction({ action: "addPayment", ...card });
      toast({ title: "Card saved", description: "Only the last four digits are stored.", tone: "success" });
      setAdding(false);
      setCard({ number: "", exp: "", name: profile.name });
    } catch (err) {
      toast({ title: (err as Error).message, tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <SectionTitle title="Payment methods" action={<Button size="sm" onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add card</Button>} />
      {profile.paymentMethods.length === 0 ? (
        <EmptyState icon={<CreditCard className="h-6 w-6" />} title="No saved cards" body="Add a card for one-tap checkout." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {profile.paymentMethods.map((pm) => (
            <div key={pm.id} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2a2724] to-[#121110] p-6 text-[#efe9df] shadow-lift">
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium tracking-wide">{pm.brand}</span>
                {pm.isDefault && <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] tracking-wide">DEFAULT</span>}
              </div>
              <p className="mt-10 font-mono text-lg tracking-[0.2em]">•••• •••• •••• {pm.last4}</p>
              <div className="mt-4 flex items-end justify-between text-xs text-white/70">
                <span>{pm.holder}</span>
                <span>
                  {String(pm.expMonth).padStart(2, "0")}/{String(pm.expYear).slice(-2)}
                </span>
              </div>
              <div className="mt-5 flex gap-4 border-t border-white/10 pt-4 text-xs">
                {!pm.isDefault && (
                  <button className="text-white/80 hover:text-white" onClick={() => accountAction({ action: "setDefault", kind: "payment", id: pm.id })}>
                    Set as default
                  </button>
                )}
                <button className="ml-auto text-white/60 hover:text-white" onClick={() => accountAction({ action: "deletePayment", id: pm.id }).then(() => toast({ title: "Card removed" }))}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title="Add a card" description="Demo only — card numbers are validated, then only brand and last four digits are stored." size="sm">
        <form onSubmit={add} className="space-y-4 p-6 sm:p-8">
          <Input
            label="Card number"
            inputMode="numeric"
            placeholder="4242 4242 4242 4242"
            value={card.number}
            onChange={(e) => setCard({ ...card, number: e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ") })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Expiry"
              placeholder="MM / YY"
              value={card.exp}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                setCard({ ...card, exp: d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d });
              }}
              required
            />
            <Input label="Name on card" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} required />
          </div>
          <Button type="submit" loading={saving} className="w-full" size="lg">Save card</Button>
        </form>
      </Modal>
    </div>
  );
}

/* ---------------- Wishlist ---------------- */
function WishlistTab() {
  const mounted = useMounted();
  const items = useWishlist((s) => s.items);
  if (!mounted) return null;
  return (
    <div>
      <SectionTitle title="Wishlist" sub={`${items.length} saved`} />
      {items.length === 0 ? (
        <EmptyState icon={<Heart className="h-6 w-6" />} title="Nothing saved yet" body="Tap the heart on any piece to keep it here." action={<Button href="/shop">Explore the collection</Button>} />
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Settings ---------------- */
function SettingsTab({ profile }: { profile: PublicUser }) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, body: Record<string, unknown>, ok: string) => {
    setBusy(key);
    try {
      await accountAction(body);
      toast({ title: ok, tone: "success" });
      if (key === "pw") setPw({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast({ title: (err as Error).message, tone: "error" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-xl space-y-12">
      <section>
        <SectionTitle title="Profile" sub={`Member since ${formatDate(profile.createdAt, { month: "long", year: "numeric" })}`} />
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); run("profile", { action: "profile", name, email }, "Profile updated"); }}>
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" loading={busy === "profile"}>Save changes</Button>
        </form>
      </section>
      <section>
        <SectionTitle title="Password" />
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); run("pw", { action: "password", ...pw }, "Password updated"); }}>
          <Input label="Current password" type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
          <Input label="New password" type="password" autoComplete="new-password" hint="At least 8 characters." value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
          <Button type="submit" variant="outline" loading={busy === "pw"}>Update password</Button>
        </form>
      </section>
      <section>
        <SectionTitle title="Communication" />
        <div className="space-y-3">
          <Checkbox label="New collections and private sales" defaultChecked />
          <Checkbox label="Order and delivery updates by SMS" />
          <Checkbox label="Studio journal (monthly)" defaultChecked />
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="display text-3xl">{title}</h2>
        {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
