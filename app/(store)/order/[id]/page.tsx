import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Copy } from "lucide-react";
import { getDb } from "@/lib/db";
import { buttonClass } from "@/lib/button-class";
import { formatDate, formatPrice, paymentLabel } from "@/lib/utils";
import { OrderTimeline } from "@/components/order/OrderTimeline";
import { StatusBadge } from "@/components/ui/misc";
import { PrintButton } from "@/components/order/PrintButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order confirmation" };

export default function OrderPage({ params, searchParams }: { params: { id: string }; searchParams: { new?: string } }) {
  const order = getDb().orders.find((o) => o.id === params.id);
  if (!order) notFound();
  const fresh = searchParams.new === "1";
  const eta = new Date(new Date(order.createdAt).getTime() + (order.delivery.id === "overnight" ? 1 : order.delivery.id === "express" ? 3 : 6) * 86400000);

  return (
    <div className="container-x max-w-5xl py-12 lg:py-16">
      <div className="text-center">
        {fresh && (
          <span className="mx-auto mb-6 grid h-16 w-16 animate-scale-in place-items-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="h-8 w-8" strokeWidth={1.5} />
          </span>
        )}
        <p className="eyebrow">Order {order.number}</p>
        <h1 className="display mt-3 text-5xl sm:text-6xl">{fresh ? `Thank you, ${order.customerName.split(" ")[0]}.` : "Order details"}</h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted">
          {fresh ? `A confirmation has been sent to ${order.email}. We'll let you know as soon as it ships.` : `Placed on ${formatDate(order.createdAt)}`}
        </p>
      </div>

      <div className="card mt-12 p-6 sm:p-10">
        <div className="mb-10 flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="eyebrow">Tracking number</p>
            <p className="mt-2 flex items-center gap-2 font-mono text-lg tracking-wider">
              {order.trackingNumber || "Assigned when shipped"}
              {order.trackingNumber && <Copy className="h-4 w-4 text-muted" aria-hidden />}
            </p>
            <p className="mt-1 text-xs text-muted">
              {order.carrier} · Estimated delivery {formatDate(eta.toISOString(), { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <OrderTimeline order={order} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="card p-6 sm:p-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="display text-2xl">Invoice</h2>
            <span className="text-xs text-muted">{formatDate(order.createdAt)}</span>
          </div>
          <ul className="divide-y divide-line">
            {order.items.map((i, idx) => (
              <li key={idx} className="flex items-center gap-4 py-4">
                <img src={i.image} alt="" className="h-20 w-16 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <Link href={`/product/${i.slug}`} className="text-sm font-medium hover:underline">
                    {i.title}
                  </Link>
                  <p className="text-xs text-muted">
                    {i.color} · {i.size} · Qty {i.qty}
                  </p>
                </div>
                <p className="text-sm tabular-nums">{formatPrice(i.price * i.qty)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2.5 border-t border-line pt-5 text-sm">
            {[
              ["Subtotal", formatPrice(order.subtotal)],
              [`Shipping (${order.delivery.label})`, order.shipping ? formatPrice(order.shipping) : "Complimentary"],
              ["GST", formatPrice(order.tax)],
              ...(order.refunded ? [["Refunded", `−${formatPrice(order.refunded)}`]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-muted">{k}</dt>
                <dd className="tabular-nums">{v}</dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between border-t border-line pt-4">
              <dt>Total paid</dt>
              <dd className="display text-3xl tabular-nums">{formatPrice(order.total - order.refunded)}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <p className="eyebrow mb-3">Shipping to</p>
            <p className="text-sm leading-relaxed">
              {order.shippingAddress.fullName}
              <br />
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 && <>, {order.shippingAddress.line2}</>}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.region} {order.shippingAddress.postalCode}
              <br />
              {order.shippingAddress.country}
            </p>
          </div>
          <div className="card p-6">
            <p className="eyebrow mb-3">Payment</p>
            <p className="text-sm">
              {paymentLabel(order.payment)}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/shop" className={buttonClass("primary", "lg")}>
              Continue shopping
            </Link>
            <Link href="/account" className={buttonClass("outline", "lg")}>
              View all orders
            </Link>
            <PrintButton />
          </div>
        </div>
      </div>
    </div>
  );
}
