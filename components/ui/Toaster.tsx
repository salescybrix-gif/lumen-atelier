"use client";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, dismiss } = useUI();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6" aria-live="polite">
      {toasts.map((t) => {
        const Icon = t.tone === "success" ? CheckCircle2 : t.tone === "error" ? AlertCircle : Info;
        return (
          <div
            key={t.id}
            className="glass pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-2xl border border-line p-4 shadow-lift"
          >
            <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", t.tone === "success" ? "text-success" : t.tone === "error" ? "text-danger" : "text-accent")} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{t.title}</p>
              {t.description && <p className="mt-0.5 text-xs text-muted">{t.description}</p>}
              {t.action && (
                <Link href={t.action.href} onClick={() => dismiss(t.id)} className="mt-2 inline-block text-xs font-medium underline underline-offset-4">
                  {t.action.label}
                </Link>
              )}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-muted transition hover:text-ink" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
