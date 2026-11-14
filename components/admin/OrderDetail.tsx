"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { StatusSelect } from "./StatusSelect";
import { OrderTimeline } from "@/components/order/OrderTimeline";
import { api } from "@/lib/api";
import { toast } from "@/lib/store/ui";
import { formatDate, formatPrice, paymentLabel } from "@/lib/utils";
import type { Order } from "@/types";

export function OrderDetail({ order, onClose, onChange }: { order: Order | null; onClose: () => void; onChange: (o: Order) => void }) {
  return (
    <Modal open={!!order} onClose={onClose} size="lg" title={order ? `Order ${order.number}` : ""} description={order ? `Placed ${formatDate(order.createdAt, { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}` : ""}>
      {order && <Body key={order.id} order={order} onChange={onChange} />}
    </Modal>
  );
}

function Body({ order, onChange }: { order: Order; onChange: (o: Order) => void }) {
  const [carrier, setCarrier] = useState(order.carrier || "Delhivery");
  const [tracking, setTracking] = useState(order.trackingNumber);
  const [refund, setRefund] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const remaining = order.total - order.refunded;
  const closed = order.status === "cancelled" || order.status === "refunded";

  const patch = async (key: string, body: Record<string, unknown>, ok: string) => {
    setBusy(key);
    try {
      const { order: updated } = await api<{ order: Order }>(`/api/admin/orders/${order.id}`, { method: "PATCH", body });
      onChange(updated);
      toast({ title: ok, tone: "success" });
      return true;
    } catch (err) {
      toast({ title: (err as Error).message, tone: "error" });
      return false;
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-8 p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <StatusSelect order={order} onChange={onChange} />
        <p className="display text-3xl tabular-nums">{formatPrice(order.total)}</p>
      </div>

      <OrderTimeline order={order} />

      <div className="grid gap-4 sm:grid-cols-3">
        <InfoCard title="Customer">
          <p className="font-medium">{order.customerName}</p>
          <p className="text-muted">{order.email}</p>
          {!order.userId && <p className="mt-1 text-xs text-muted">Guest checkout</p>}
        </InfoCard>
        <InfoCard title="Ship to">
          {order.shippingAddress.line1}
          {order.shippingAddress.line2 && `, ${order.shippingAddress.line2}`}
          <br />
          {order.shippingAddress.city}, {order.shippingAddress.region} {order.shippingAddress.postalCode}
          <br />
          {order.shippingAddress.country}
        </InfoCard>
        <InfoCard title="Payment">
          {paymentLabel(order.payment)}
          <br />
          <span className="text-muted">{order.delivery.label} delivery</span>
        </InfoCard>
      </div>

      <div>
        <p className="eyebrow mb-3">Items</p>
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {order.items.map((i, k) => (
            <li key={k} className="flex items-center gap-4 p-4">
              <img src={i.image} alt="" className="h-14 w-11 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{i.title}</p>
                <p className="text-xs text-muted">{i.color} · {i.size} · {formatPrice(i.price)} × {i.qty}</p>
              </div>
              <span className="text-sm tabular-nums">{formatPrice(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 text-sm">
          {[
            ["Subtotal", formatPrice(order.subtotal)],
            ["Shipping", order.shipping ? formatPrice(order.shipping) : "Free"],
            ["GST", formatPrice(order.tax)],
            ...(order.refunded ? [["Refunded", `−${formatPrice(order.refunded)}`]] : []),
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <dt className="text-muted">{k}</dt>
              <dd className="tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="space-y-4 rounded-2xl border border-line p-5"
          onSubmit={(e) => {
            e.preventDefault();
            patch("tracking", { carrier, trackingNumber: tracking }, "Tracking info updated");
          }}
        >
          <p className="text-sm font-medium">Tracking</p>
          <div className="grid grid-cols-[140px_1fr] gap-3">
            <Select value={carrier} onChange={(e) => setCarrier(e.target.value)} aria-label="Carrier">
              {["Delhivery", "Blue Dart", "DTDC", "India Post", "Ekart"].map((c) => <option key={c}>{c}</option>)}
            </Select>
            <Input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking number" aria-label="Tracking number" className="font-mono" />
          </div>
          <Button type="submit" size="sm" variant="outline" loading={busy === "tracking"}>Save tracking</Button>
        </form>

        <form
          className="space-y-4 rounded-2xl border border-line p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            const cents = Math.round(Number(refund) * 100);
            if (!confirm(`Refund ${formatPrice(cents)} to ${paymentLabel(order.payment)}? (back to the original payment method)`)) return;
            if (await patch("refund", { refund: cents, note }, "Refund processed")) {
              setRefund("");
              setNote("");
            }
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Refund</p>
            <span className="text-xs text-muted">{formatPrice(remaining)} refundable</span>
          </div>
          {closed && order.status === "cancelled" ? (
            <p className="text-xs text-muted">Cancelled orders are voided — no capture to refund.</p>
          ) : remaining <= 0 ? (
            <p className="text-xs text-muted">This order has been fully refunded.</p>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <Input type="number" step="0.01" min="0.01" max={remaining / 100} value={refund} onChange={(e) => setRefund(e.target.value)} placeholder="Amount (₹)" aria-label="Refund amount" required />
                <Button type="button" variant="secondary" onClick={() => setRefund((remaining / 100).toFixed(2))} className="h-12">Full</Button>
              </div>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason (optional)" aria-label="Refund reason" />
              <Button type="submit" size="sm" variant="danger" loading={busy === "refund"}>Process refund</Button>
            </>
          )}
        </form>
      </div>

      <div>
        <p className="eyebrow mb-3">Activity</p>
        <ol className="space-y-3 border-l border-line pl-5">
          {[...order.history].reverse().map((h, i) => (
            <li key={i} className="relative text-sm">
              <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-ink ring-4 ring-surface" />
              <span className="font-medium capitalize">{h.status}</span>
              {h.note && <span className="text-muted"> — {h.note}</span>}
              <p className="text-xs text-muted">{formatDate(h.at, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-sunken/60 p-4 text-sm leading-relaxed">
      <p className="eyebrow mb-2">{title}</p>
      {children}
    </div>
  );
}
