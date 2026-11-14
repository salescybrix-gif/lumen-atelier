import { Check, Circle, Package, Truck, Home, XCircle } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

const FLOW: { status: OrderStatus; label: string; icon: typeof Check }[] = [
  { status: "pending", label: "Order placed", icon: Circle },
  { status: "processing", label: "Processing", icon: Package },
  { status: "shipped", label: "Shipped", icon: Truck },
  { status: "delivered", label: "Delivered", icon: Home },
];

/** Horizontal tracking timeline (stacks vertically on narrow screens). */
export function OrderTimeline({ order }: { order: Order }) {
  const closed = order.status === "cancelled" || order.status === "refunded";
  const reached = new Map(order.history.map((h) => [h.status, h.at]));
  const currentIdx = FLOW.findIndex((f) => f.status === order.status);
  const lastIdx = closed ? Math.max(...FLOW.map((f, i) => (reached.has(f.status) ? i : -1))) : currentIdx;

  return (
    <div>
      <ol className="grid gap-5 sm:grid-cols-4 sm:gap-0">
        {FLOW.map((f, i) => {
          const done = i <= lastIdx;
          const at = reached.get(f.status);
          const Icon = done ? Check : f.icon;
          return (
            <li key={f.status} className="relative flex items-center gap-4 sm:flex-col sm:items-start sm:gap-3">
              {i < FLOW.length - 1 && (
                <span className={cn("absolute left-[15px] top-8 h-[calc(100%-4px)] w-px sm:left-8 sm:right-0 sm:top-[15px] sm:h-px sm:w-auto", i < lastIdx ? "bg-ink" : "bg-line")} />
              )}
              <span className={cn("relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border transition", done ? "border-ink bg-ink text-canvas" : "border-line bg-canvas text-muted")}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className={cn("text-sm", done ? "font-medium" : "text-muted")}>{f.label}</p>
                <p className="text-xs text-muted">{at ? formatDate(at, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—"}</p>
              </div>
            </li>
          );
        })}
      </ol>
      {closed && (
        <p className="mt-6 flex items-center gap-2 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
          <XCircle className="h-4 w-4" />
          This order was {order.status}
          {order.history.at(-1)?.note ? ` — ${order.history.at(-1)!.note}` : "."}
        </p>
      )}
    </div>
  );
}
