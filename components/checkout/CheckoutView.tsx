"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, CreditCard, Loader2, Lock, ShoppingBag, Smartphone } from "lucide-react";
import { UpiPanel, type UpiMode } from "./UpiPanel";
import { Button } from "@/components/ui/Button";
import { Input, Select, Checkbox } from "@/components/ui/Input";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { useCart, cartSubtotal } from "@/lib/store/cart";
import { useSession, post } from "@/lib/store/session";
import { toast } from "@/lib/store/ui";
import { useMounted } from "@/lib/hooks";
import { cardBrand, cn, DELIVERY_METHODS, FREE_SHIPPING_THRESHOLD, formatPrice, INDIAN_STATES, STANDARD_SHIPPING_FEE, TAX_RATE, UPI_ID_RE } from "@/lib/utils";
import type { DeliveryMethodId, Order } from "@/types";

const STEPS = ["Information", "Delivery", "Payment"] as const;
const COUNTRIES = ["India"];

type Address = Order["shippingAddress"];
const emptyAddress: Address = { fullName: "", line1: "", line2: "", city: "", region: "", postalCode: "", country: "India", phone: "" };

export function CheckoutView() {
  const mounted = useMounted();
  const router = useRouter();
  const { items, clear } = useCart();
  const { user, profile, status } = useSession();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [savedAddressId, setSavedAddressId] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<DeliveryMethodId>("standard");
  const [savedCard, setSavedCard] = useState<string | null>(null);
  const [card, setCard] = useState({ number: "", exp: "", cvc: "", name: "" });
  const [payMethod, setPayMethod] = useState<"upi" | "card">("upi");
  const [upiMode, setUpiMode] = useState<UpiMode>("id");
  const [upiId, setUpiId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placing, setPlacing] = useState(false);
  const [newsletter, setNewsletter] = useState(true);

  // Prefill from the signed-in profile.
  useEffect(() => {
    if (!profile) return;
    setEmail((e) => e || profile.email);
    const def = profile.addresses.find((a) => a.isDefault) ?? profile.addresses[0];
    if (def && !savedAddressId) {
      setSavedAddressId(def.id);
      setAddress({ fullName: def.fullName, line1: def.line1, line2: def.line2 ?? "", city: def.city, region: def.region, postalCode: def.postalCode, country: def.country, phone: def.phone ?? "" });
    }
    const pm = profile.paymentMethods.find((p) => p.isDefault) ?? profile.paymentMethods[0];
    if (pm && savedCard === null) setSavedCard(pm.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const subtotal = cartSubtotal(items);
  const method = DELIVERY_METHODS.find((d) => d.id === delivery)!;
  const shipping = delivery === "standard" && subtotal < FREE_SHIPPING_THRESHOLD ? STANDARD_SHIPPING_FEE : method.price;
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + shipping + tax;

  const validateInfo = () => {
    const e: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email";
    (["fullName", "line1", "city", "region", "postalCode"] as const).forEach((k) => {
      if (!String(address[k] ?? "").trim()) e[k] = "Required";
    });
    if (address.postalCode && !/^[1-9]\d{5}$/.test(address.postalCode.trim())) e.postalCode = "Enter a valid 6-digit PIN code";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const validateCard = () => {
    if (payMethod === "upi") {
      const ok = upiMode === "qr" || UPI_ID_RE.test(upiId);
      setErrors(ok ? {} : { upi: "Enter a valid UPI ID, e.g. name@okhdfcbank" });
      return ok;
    }
    if (savedCard) return true;
    const e: Record<string, string> = {};
    if (card.number.replace(/\s/g, "").length < 13) e.number = "Enter a valid card number";
    if (!/^\d{2}\s?\/\s?\d{2}$/.test(card.exp)) e.exp = "MM / YY";
    if (!/^\d{3,4}$/.test(card.cvc)) e.cvc = "3–4 digits";
    if (!card.name.trim()) e.name = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const placeOrder = async () => {
    if (!validateCard()) return;
    setPlacing(true);
    try {
      // Simulate the gateway round-trip (UPI waits for "approval" in the customer's app).
      await new Promise((r) => setTimeout(r, payMethod === "upi" ? 2600 : 1100));
      const { order } = await post<{ order: Order }>("/api/orders", {
        items: items.map((i) => ({ productId: i.productId, size: i.size, color: i.color, qty: i.qty })),
        email,
        shippingAddress: address,
        deliveryId: delivery,
        payment:
          payMethod === "upi"
            ? { method: "upi", ...(upiMode === "qr" ? { qr: true } : { upiId }) }
            : savedCard
            ? { method: "card", savedId: savedCard }
            : { method: "card", number: card.number, exp: card.exp, cvc: card.cvc, name: card.name },
      });
      clear();
      toast({ title: "Order placed successfully", description: `Order ${order.number} is confirmed.`, tone: "success" });
      router.push(`/order/${order.id}?new=1`);
    } catch (err) {
      toast({ title: "Payment failed", description: (err as Error).message, tone: "error" });
      setPlacing(false);
    }
  };

  const summary = useMemo(
    () => (
      <div className="space-y-5">
        <ul className="space-y-4">
          {items.map((i) => (
            <li key={i.key} className="flex items-center gap-4">
              <div className="relative shrink-0">
                <img src={i.image} alt="" className="h-20 w-16 rounded-xl object-cover" />
                <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1.5 text-[10px] font-semibold text-canvas">{i.qty}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{i.title}</p>
                <p className="text-xs text-muted">{i.color} · {i.size}</p>
              </div>
              <p className="text-sm tabular-nums">{formatPrice(i.price * i.qty)}</p>
            </li>
          ))}
        </ul>
        <div className="space-y-2.5 border-t border-line pt-5 text-sm">
          <Row label="Subtotal" value={formatPrice(subtotal)} />
          <Row label={`Shipping · ${method.label}`} value={step === 0 ? "Calculated next" : shipping === 0 ? "Complimentary" : formatPrice(shipping)} />
          <Row label={`GST (${Math.round(TAX_RATE * 100)}%)`} value={formatPrice(tax)} />
        </div>
        <div className="flex items-baseline justify-between border-t border-line pt-5">
          <span className="text-sm">Total</span>
          <span className="display text-3xl tabular-nums">{formatPrice(step === 0 ? subtotal + tax : total)}</span>
        </div>
      </div>
    ),
    [items, subtotal, method, shipping, tax, total, step]
  );

  if (!mounted || status === "loading") {
    return (
      <div className="container-x grid gap-10 py-14 lg:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-2/3" />
        </div>
        <Skeleton className="h-80 w-full rounded-3xl" />
      </div>
    );
  }

  if (items.length === 0 && !placing) {
    return (
      <div className="container-x py-20">
        <EmptyState icon={<ShoppingBag className="h-6 w-6" />} title="Your bag is empty" body="Add a few pieces before checking out." action={<Button href="/shop">Continue shopping</Button>} />
      </div>
    );
  }

  const field = (k: keyof Address, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <Input
      label={label}
      value={String(address[k] ?? "")}
      error={errors[k]}
      onChange={(e) => {
        setSavedAddressId(null);
        setAddress((a) => ({ ...a, [k]: e.target.value }));
      }}
      {...props}
    />
  );

  return (
    <div className="container-x py-10 lg:py-14">
      {placing && (
        <div className="fixed inset-0 z-[90] grid animate-fade-in place-items-center bg-canvas/80 backdrop-blur-md">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
            <p className="display mt-5 text-3xl">{payMethod === "upi" ? "Waiting for UPI approval…" : "Authorising payment…"}</p>
            <p className="mt-2 max-w-xs text-sm text-muted">
              {payMethod === "upi"
                ? upiMode === "qr"
                  ? "Complete the payment in your UPI app after scanning."
                  : `Open your UPI app and approve the request sent to ${upiId}.`
                : "Please don't close this window."}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_440px] xl:gap-20">
        <div>
          <h1 className="display text-5xl">Checkout</h1>

          {/* Stepper */}
          <ol className="mt-8 flex items-center gap-2 text-xs sm:gap-4">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-2 sm:gap-4">
                <button
                  disabled={i > step}
                  onClick={() => setStep(i)}
                  className={cn("flex items-center gap-2 transition", i <= step ? "text-ink" : "text-muted")}
                >
                  <span className={cn("grid h-6 w-6 place-items-center rounded-full border text-[11px]", i < step ? "border-ink bg-ink text-canvas" : i === step ? "border-ink" : "border-line")}>
                    {i < step ? <Check className="h-3 w-3" /> : i + 1}
                  </span>
                  <span className={cn(i === step && "font-medium")}>{s}</span>
                </button>
                {i < STEPS.length - 1 && <span className="h-px w-6 bg-line sm:w-12" />}
              </li>
            ))}
          </ol>

          <details className="mt-8 rounded-2xl border border-line bg-surface p-5 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm">
              <span>Show order summary</span>
              <span className="font-medium">{formatPrice(total)}</span>
            </summary>
            <div className="mt-5">{summary}</div>
          </details>

          <div className="mt-10">
            {step === 0 && (
              <div className="animate-fade-in space-y-8">
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-medium">Contact</h2>
                    {!user && (
                      <Link href="/login?next=/checkout" className="text-xs text-muted underline underline-offset-4 hover:text-ink">
                        Have an account? Sign in
                      </Link>
                    )}
                  </div>
                  <Input label="Email" type="email" value={email} error={errors.email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                  <Checkbox className="mt-4" label={<span className="text-xs text-muted">Email me about new collections and private sales</span>} checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} />
                </section>

                <section>
                  <h2 className="mb-4 text-lg font-medium">Shipping address</h2>
                  {profile && profile.addresses.length > 0 && (
                    <div className="mb-6 grid gap-3 sm:grid-cols-2">
                      {profile.addresses.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => {
                            setSavedAddressId(a.id);
                            setErrors({});
                            setAddress({ fullName: a.fullName, line1: a.line1, line2: a.line2 ?? "", city: a.city, region: a.region, postalCode: a.postalCode, country: a.country, phone: a.phone ?? "" });
                          }}
                          className={cn("rounded-2xl border p-4 text-left text-sm transition", savedAddressId === a.id ? "border-ink bg-surface" : "border-line hover:border-ink/40")}
                        >
                          <p className="font-medium">{a.label}</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted">
                            {a.line1}, {a.city} {a.region} {a.postalCode}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">{field("fullName", "Full name", { autoComplete: "name" })}</div>
                    <div className="sm:col-span-2">{field("line1", "Address", { autoComplete: "address-line1" })}</div>
                    <div className="sm:col-span-2">{field("line2", "Apartment, suite (optional)", { autoComplete: "address-line2" })}</div>
                    {field("city", "City", { autoComplete: "address-level2" })}
                    <Select label="State" value={address.region} error={errors.region} onChange={(e) => { setSavedAddressId(null); setAddress((a) => ({ ...a, region: e.target.value })); }} autoComplete="address-level1">
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </Select>
                    {field("postalCode", "PIN code", { autoComplete: "postal-code", inputMode: "numeric", maxLength: 6, placeholder: "6-digit PIN" })}
                    <Select label="Country" value={address.country} onChange={(e) => setAddress((a) => ({ ...a, country: e.target.value }))}>
                      {COUNTRIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </Select>
                    <div className="sm:col-span-2">{field("phone", "Mobile number (for delivery updates)", { autoComplete: "tel", type: "tel", placeholder: "+91 98765 43210" })}</div>
                  </div>
                </section>
                <StepNav onNext={() => validateInfo() && setStep(1)} nextLabel="Continue to delivery" back={{ href: "/shop", label: "Return to shop" }} />
              </div>
            )}

            {step === 1 && (
              <div className="animate-fade-in space-y-8">
                <Recap label="Ship to" value={`${address.line1}, ${address.city} ${address.region} ${address.postalCode}`} onEdit={() => setStep(0)} />
                <section>
                  <h2 className="mb-4 text-lg font-medium">Delivery method</h2>
                  <div className="space-y-3">
                    {DELIVERY_METHODS.map((d) => {
                      const price = d.id === "standard" && subtotal < FREE_SHIPPING_THRESHOLD ? STANDARD_SHIPPING_FEE : d.price;
                      return (
                        <label
                          key={d.id}
                          className={cn("flex cursor-pointer items-center gap-4 rounded-2xl border p-5 transition", delivery === d.id ? "border-ink bg-surface" : "border-line hover:border-ink/40")}
                        >
                          <input type="radio" name="delivery" className="sr-only" checked={delivery === d.id} onChange={() => setDelivery(d.id)} />
                          <span className={cn("grid h-5 w-5 place-items-center rounded-full border", delivery === d.id ? "border-ink" : "border-line")}>
                            {delivery === d.id && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{d.label}</p>
                            <p className="text-xs text-muted">{d.eta}</p>
                          </div>
                          <span className="text-sm tabular-nums">{price === 0 ? "Free" : formatPrice(price)}</span>
                        </label>
                      );
                    })}
                  </div>
                </section>
                <StepNav onNext={() => setStep(2)} nextLabel="Continue to payment" back={{ onClick: () => setStep(0), label: "Back to information" }} />
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in space-y-8">
                <div className="divide-y divide-line rounded-2xl border border-line">
                  <Recap bare label="Contact" value={email} onEdit={() => setStep(0)} />
                  <Recap bare label="Ship to" value={`${address.line1}, ${address.city} ${address.region}`} onEdit={() => setStep(0)} />
                  <Recap bare label="Method" value={`${method.label} · ${method.eta}`} onEdit={() => setStep(1)} />
                </div>

                <section>
                  <h2 className="text-lg font-medium">Payment</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                    <Lock className="h-3 w-3" /> All transactions are secure and encrypted.
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Payment method">
                    {([
                      ["upi", "UPI", "Google Pay, PhonePe, Paytm & more", Smartphone],
                      ["card", "Card", "Credit / debit · Visa, Mastercard, RuPay", CreditCard],
                    ] as const).map(([id, label, sub, Icon]) => (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={payMethod === id}
                        onClick={() => {
                          setPayMethod(id);
                          setErrors({});
                        }}
                        className={cn("flex items-start gap-3 rounded-2xl border p-4 text-left transition", payMethod === id ? "border-ink bg-surface" : "border-line hover:border-ink/40")}
                      >
                        <Icon className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.5} />
                        <span>
                          <span className="block text-sm font-medium">{label}</span>
                          <span className="block text-xs text-muted">{sub}</span>
                        </span>
                      </button>
                    ))}
                  </div>

                  {payMethod === "upi" && <UpiPanel mode={upiMode} setMode={setUpiMode} upiId={upiId} setUpiId={setUpiId} error={errors.upi} amount={total} />}

                  {payMethod === "card" && profile && profile.paymentMethods.length > 0 && (
                    <div className="mt-5 space-y-3">
                      {profile.paymentMethods.map((pm) => (
                        <label key={pm.id} className={cn("flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition", savedCard === pm.id ? "border-ink bg-surface" : "border-line")}>
                          <input type="radio" className="sr-only" checked={savedCard === pm.id} onChange={() => setSavedCard(pm.id)} />
                          <CreditCard className="h-5 w-5" strokeWidth={1.5} />
                          <span className="flex-1 text-sm">
                            {pm.brand} ending {pm.last4}
                          </span>
                          <span className="text-xs text-muted">
                            {String(pm.expMonth).padStart(2, "0")}/{String(pm.expYear).slice(-2)}
                          </span>
                        </label>
                      ))}
                      <label className={cn("flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition", savedCard === "" ? "border-ink bg-surface" : "border-line")}>
                        <input type="radio" className="sr-only" checked={savedCard === ""} onChange={() => setSavedCard("")} />
                        <CreditCard className="h-5 w-5" strokeWidth={1.5} />
                        <span className="text-sm">Use a new card</span>
                      </label>
                    </div>
                  )}

                  {payMethod === "card" && !savedCard && (
                    <div className="mt-5 animate-fade-in rounded-2xl border border-line bg-surface p-5">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="relative sm:col-span-2">
                          <Input
                            label="Card number"
                            inputMode="numeric"
                            autoComplete="cc-number"
                            placeholder="1234 1234 1234 1234"
                            value={card.number}
                            error={errors.number}
                            onChange={(e) => setCard((c) => ({ ...c, number: e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ") }))}
                          />
                          {card.number && <span className="absolute right-4 top-[38px] text-xs font-medium text-muted">{cardBrand(card.number)}</span>}
                        </div>
                        <Input
                          label="Expiry"
                          placeholder="MM / YY"
                          autoComplete="cc-exp"
                          inputMode="numeric"
                          value={card.exp}
                          error={errors.exp}
                          onChange={(e) => {
                            const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                            setCard((c) => ({ ...c, exp: d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d }));
                          }}
                        />
                        <Input label="Security code" placeholder="CVC" autoComplete="cc-csc" inputMode="numeric" value={card.cvc} error={errors.cvc} onChange={(e) => setCard((c) => ({ ...c, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) }))} />
                        <div className="sm:col-span-2">
                          <Input label="Name on card" autoComplete="cc-name" value={card.name} error={errors.name} onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))} />
                        </div>
                      </div>
                      <p className="mt-4 rounded-xl bg-sunken px-4 py-3 text-xs leading-relaxed text-muted">
                        <span className="font-medium text-ink">Mock gateway.</span> Use 4242 4242 4242 4242 with any future date and CVC to succeed, or 4000 0000 0000 0002 to simulate a decline.
                      </p>
                    </div>
                  )}
                </section>
                <StepNav onNext={placeOrder} nextLabel={payMethod === "upi" && upiMode === "id" ? `Send UPI request · ${formatPrice(total)}` : `Pay ${formatPrice(total)}`} loading={placing} back={{ onClick: () => setStep(1), label: "Back to delivery" }} />
              </div>
            )}
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="card sticky top-28 p-7">
            <h2 className="mb-6 text-sm font-medium">Order summary</h2>
            {summary}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function Recap({ label, value, onEdit, bare }: { label: string; value: string; onEdit: () => void; bare?: boolean }) {
  return (
    <div className={cn("flex items-center gap-4 p-4 text-sm", !bare && "rounded-2xl border border-line")}>
      <span className="w-16 shrink-0 text-muted">{label}</span>
      <span className="min-w-0 flex-1 truncate">{value}</span>
      <button onClick={onEdit} className="text-xs underline underline-offset-4">
        Change
      </button>
    </div>
  );
}

function StepNav({ onNext, nextLabel, back, loading }: { onNext: () => void; nextLabel: string; loading?: boolean; back: { href?: string; onClick?: () => void; label: string } }) {
  return (
    <div className="flex flex-col-reverse items-center justify-between gap-4 border-t border-line pt-8 sm:flex-row">
      {back.href ? (
        <Link href={back.href} className="flex items-center gap-1 text-sm text-muted hover:text-ink">
          <ChevronLeft className="h-4 w-4" /> {back.label}
        </Link>
      ) : (
        <button onClick={back.onClick} className="flex items-center gap-1 text-sm text-muted hover:text-ink">
          <ChevronLeft className="h-4 w-4" /> {back.label}
        </button>
      )}
      <Button size="lg" onClick={onNext} loading={loading} className="w-full sm:w-auto">
        {nextLabel}
      </Button>
    </div>
  );
}
