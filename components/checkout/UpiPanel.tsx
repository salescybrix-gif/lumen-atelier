"use client";
import { useMemo } from "react";
import { QrCode, Smartphone } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { cn, formatPrice } from "@/lib/utils";

export type UpiMode = "id" | "qr";

const APPS = [
  { name: "Google Pay", handle: "okhdfcbank" },
  { name: "PhonePe", handle: "ybl" },
  { name: "Paytm", handle: "paytm" },
  { name: "BHIM", handle: "upi" },
];

/** UPI payment: pay by UPI ID (collect request) or by scanning a QR code. Both are mocked. */
export function UpiPanel({
  mode,
  setMode,
  upiId,
  setUpiId,
  error,
  amount,
}: {
  mode: UpiMode;
  setMode: (m: UpiMode) => void;
  upiId: string;
  setUpiId: (v: string) => void;
  error?: string;
  amount: number;
}) {
  return (
    <div className="mt-5 animate-fade-in rounded-2xl border border-line bg-surface p-5">
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-full bg-sunken p-1">
        {([
          ["id", "UPI ID", Smartphone],
          ["qr", "Scan QR", QrCode],
        ] as const).map(([m, label, Icon]) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn("flex items-center justify-center gap-2 rounded-full py-2 text-xs font-medium transition", mode === m ? "bg-surface text-ink shadow-soft" : "text-muted hover:text-ink")}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {mode === "id" ? (
        <div className="animate-fade-in">
          <Input
            label="UPI ID"
            placeholder="yourname@okhdfcbank"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            value={upiId}
            error={error}
            onChange={(e) => setUpiId(e.target.value.trim())}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {APPS.map((a) => (
              <button
                key={a.name}
                type="button"
                onClick={() => setUpiId(`${(upiId.split("@")[0] || "")}@${a.handle}`)}
                className="rounded-full border border-line px-3 py-1.5 text-xs transition hover:border-ink/50"
              >
                {a.name} <span className="text-muted">@{a.handle}</span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            We'll send a payment request of <span className="font-medium text-ink">{formatPrice(amount)}</span> to this UPI ID. Open your UPI app and approve it with your UPI PIN.
          </p>
        </div>
      ) : (
        <div className="flex animate-fade-in flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <MockQr seed={amount} />
          <div>
            <p className="text-sm font-medium">Scan with any UPI app</p>
            <p className="mt-1 text-xs text-muted">Google Pay, PhonePe, Paytm, BHIM or your bank's app.</p>
            <p className="display mt-3 text-3xl tabular-nums">{formatPrice(amount)}</p>
            <p className="mt-1 text-xs text-muted">Payee: Lumen Atelier</p>
          </div>
        </div>
      )}

      <p className="mt-5 rounded-xl bg-sunken px-4 py-3 text-xs leading-relaxed text-muted">
        <span className="font-medium text-ink">Mock UPI.</span> Any valid UPI ID (e.g. demo@okhdfcbank) is approved; use <span className="font-mono">fail@upi</span> to simulate a declined request. The QR code is decorative and can't be scanned.
      </p>
    </div>
  );
}

/** Decorative QR-style code (deterministic pattern, not a real payment QR). */
function MockQr({ seed }: { seed: number }) {
  const N = 25;
  const cells = useMemo(() => {
    let s = seed % 2147483647 || 1;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const finder = (x: number, y: number) =>
      [[0, 0], [N - 7, 0], [0, N - 7]].some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
    const out: [number, number][] = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!finder(x, y) && rnd() > 0.52) out.push([x, y]);
    return out;
  }, [seed]);
  const Finder = ({ x, y }: { x: number; y: number }) => (
    <g>
      <rect x={x} y={y} width={7} height={7} fill="#111" />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="#fff" />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="#111" />
    </g>
  );
  return (
    <div className="shrink-0 rounded-2xl bg-white p-3 shadow-soft">
      <svg viewBox={`-1 -1 ${N + 2} ${N + 2}`} className="h-40 w-40" shapeRendering="crispEdges" role="img" aria-label="Demo UPI QR code">
        <rect x={-1} y={-1} width={N + 2} height={N + 2} fill="#fff" />
        {cells.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#111" />
        ))}
        <Finder x={0} y={0} />
        <Finder x={N - 7} y={0} />
        <Finder x={0} y={N - 7} />
      </svg>
    </div>
  );
}
