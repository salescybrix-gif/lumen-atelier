import { Star } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import type { OrderStatus } from "@/types";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "dark";
const tones: Record<Tone, string> = {
  neutral: "bg-sunken text-ink/80 border-line",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/25",
  danger: "bg-danger/10 text-danger border-danger/20",
  info: "bg-accent/10 text-accent border-accent/25",
  dark: "bg-ink text-canvas border-ink",
};

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide", tones[tone], className)}>
      {children}
    </span>
  );
}

const statusTone: Record<OrderStatus, Tone> = {
  pending: "warning",
  processing: "info",
  shipped: "neutral",
  delivered: "success",
  cancelled: "danger",
  refunded: "danger",
};
export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge tone={statusTone[status]} className="capitalize">
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </Badge>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star className="absolute inset-0 text-line" style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="text-ink" style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function Price({ value, compareAt, className }: { value: number; compareAt?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline gap-2 tabular-nums", className)}>
      <span>{formatPrice(value)}</span>
      {compareAt && compareAt > value && <span className="text-muted line-through decoration-1">{formatPrice(compareAt)}</span>}
    </span>
  );
}

export function EmptyState({ icon, title, body, action }: { icon?: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && <div className="mb-5 grid h-14 w-14 place-items-center rounded-full bg-sunken text-muted">{icon}</div>}
      <h3 className="display text-2xl">{title}</h3>
      {body && <p className="mt-2 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
