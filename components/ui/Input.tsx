"use client";
import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-xl border border-line bg-surface px-4 text-sm text-ink placeholder:text-muted/70 transition-colors focus:border-ink/60 focus:outline-none focus:ring-0 disabled:opacity-50";

interface Wrap {
  label?: string;
  hint?: string;
  error?: string;
}

function Shell({ id, label, hint, error, children, className }: Wrap & { id: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-muted">
          {label}
        </label>
      )}
      {children}
      {error ? <p className="text-xs text-danger">{error}</p> : hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & Wrap & { wrapClassName?: string }>(
  function Input({ label, hint, error, className, wrapClassName, id, ...props }, ref) {
    const auto = useId();
    const fid = id ?? auto;
    return (
      <Shell id={fid} label={label} hint={hint} error={error} className={wrapClassName}>
        <input ref={ref} id={fid} className={cn(field, "h-12", error && "border-danger", className)} {...props} />
      </Shell>
    );
  }
);

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & Wrap & { wrapClassName?: string }>(
  function Textarea({ label, hint, error, className, wrapClassName, id, ...props }, ref) {
    const auto = useId();
    const fid = id ?? auto;
    return (
      <Shell id={fid} label={label} hint={hint} error={error} className={wrapClassName}>
        <textarea ref={ref} id={fid} className={cn(field, "min-h-[110px] py-3", className)} {...props} />
      </Shell>
    );
  }
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & Wrap & { wrapClassName?: string }>(
  function Select({ label, hint, error, className, wrapClassName, id, children, ...props }, ref) {
    const auto = useId();
    const fid = id ?? auto;
    return (
      <Shell id={fid} label={label} hint={hint} error={error} className={wrapClassName}>
        <div className="relative">
          <select ref={ref} id={fid} className={cn(field, "h-12 appearance-none pr-10", className)} {...props}>
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        </div>
      </Shell>
    );
  }
);

export function Checkbox({ label, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-center gap-3 text-sm", className)}>
      <input type="checkbox" className="peer sr-only" {...props} />
      <span className="grid h-[18px] w-[18px] place-items-center rounded-[5px] border border-line bg-surface transition peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:ring-2 peer-focus-visible:ring-ink/50 [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100">
        <svg viewBox="0 0 12 12" className="h-3 w-3 text-canvas" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2.5 6.5 5 9l4.5-6" />
        </svg>
      </span>
      <span className="text-ink/90">{label}</span>
    </label>
  );
}
