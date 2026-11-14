import { cn } from "@/lib/utils";

export type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "link";
export type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-canvas hover:bg-ink/85 shadow-soft",
  secondary: "bg-sunken text-ink hover:bg-line/70",
  outline: "border border-line bg-transparent text-ink hover:border-ink/60 hover:bg-sunken/50",
  ghost: "bg-transparent text-ink hover:bg-sunken",
  danger: "bg-danger text-white hover:bg-danger/90",
  link: "bg-transparent text-ink underline-offset-4 hover:underline px-0 h-auto",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-xs",
  md: "h-11 px-6 text-[13px]",
  lg: "h-14 px-8 text-sm",
  icon: "h-10 w-10",
};

/** Usable from both server and client components (e.g. to style a <Link> as a button). */
export const buttonClass = (variant: Variant = "primary", size: Size = "md", className?: string) =>
  cn(
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-wide transition-all duration-200 active:scale-[.98] disabled:pointer-events-none disabled:opacity-45",
    variants[variant],
    sizes[size],
    className
  );
