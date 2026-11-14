"use client";
import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "@/lib/store/ui";
import { cn } from "@/lib/utils";
import { ORDER_STATUSES, type Order, type OrderStatus } from "@/types";

const tone: Record<OrderStatus, string> = {
  pending: "text-warning bg-warning/10 border-warning/25",
  processing: "text-accent bg-accent/10 border-accent/25",
  shipped: "text-ink bg-sunken border-line",
  delivered: "text-success bg-success/10 border-success/20",
  cancelled: "text-danger bg-danger/10 border-danger/20",
  refunded: "text-danger bg-danger/10 border-danger/20",
};

/** Inline status dropdown used in order tables. */
export function StatusSelect({ order, onChange }: { order: Order; onChange: (o: Order) => void }) {
  const [busy, setBusy] = useState(false);
  const closed = order.status === "cancelled" || order.status === "refunded";
  return (
    <div className="relative inline-flex items-center" onClick={(e) => e.stopPropagation()}>
      <select
        value={order.status}
        disabled={busy || closed}
        aria-label={`Status for ${order.number}`}
        onChange={async (e) => {
          const status = e.target.value as OrderStatus;
          if (status === "cancelled" && !confirm(`Cancel ${order.number}? Items will be returned to stock.`)) return;
          setBusy(true);
          try {
            const { order: updated } = await api<{ order: Order }>(`/api/admin/orders/${order.id}`, { method: "PATCH", body: { status } });
            onChange(updated);
            toast({ title: `${order.number} marked ${status}`, tone: "success" });
          } catch (err) {
            toast({ title: (err as Error).message, tone: "error" });
          } finally {
            setBusy(false);
          }
        }}
        className={cn("h-8 cursor-pointer appearance-none rounded-full border pl-3 pr-7 text-xs font-medium capitalize focus:outline-none disabled:cursor-default", tone[order.status])}
      >
        {ORDER_STATUSES.filter((s) => s !== "refunded" || order.status === "refunded").map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {busy ? (
        <Loader2 className="pointer-events-none absolute right-2 h-3 w-3 animate-spin" />
      ) : (
        !closed && <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 opacity-60" />
      )}
    </div>
  );
}
