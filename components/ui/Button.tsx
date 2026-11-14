"use client";
import { forwardRef } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { buttonClass, type Size, type Variant } from "@/lib/button-class";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  href?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, className, children, href, disabled, ...props },
  ref
) {
  if (href) {
    return (
      <Link href={href} className={buttonClass(variant, size, className)}>
        {children}
      </Link>
    );
  }
  return (
    <button ref={ref} className={buttonClass(variant, size, className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});
