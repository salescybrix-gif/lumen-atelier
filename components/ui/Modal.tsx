"use client";
import { useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEscape, useMounted, useScrollLock } from "@/lib/hooks";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" };

export function Modal({ open, onClose, title, description, children, footer, size = "md", className }: ModalProps) {
  const mounted = useMounted();
  const close = useCallback(() => onClose(), [onClose]);
  useEscape(close, open);
  useScrollLock(open);
  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={close} />
      <div
        className={cn(
          "relative flex max-h-[92vh] w-full animate-scale-in flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-lift sm:rounded-3xl",
          widths[size],
          className
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-6 border-b border-line px-6 py-5 sm:px-8">
            <div>
              {title && <h2 className="display text-2xl">{title}</h2>}
              {description && <p className="mt-1 text-sm text-muted">{description}</p>}
            </div>
            <button onClick={close} aria-label="Close" className="-mr-2 rounded-full p-2 text-muted transition hover:bg-sunken hover:text-ink">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        {!title && !description && (
          <button
            onClick={close}
            aria-label="Close"
            className="glass absolute right-4 top-4 z-10 rounded-full p-2 text-ink shadow-soft transition hover:scale-105"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-line bg-canvas/60 px-6 py-4 sm:px-8">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
