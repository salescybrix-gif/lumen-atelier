"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, LayoutDashboard, LogOut, Menu, Moon, Package, ShoppingCart, Sun, Users, X } from "lucide-react";
import { useSession } from "@/lib/store/session";
import { useTheme } from "@/components/layout/Providers";
import { cn, initials } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useSession();
  const { toggle } = useTheme();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const nav = (
    <>
      <Link href="/admin" className="flex items-baseline gap-2 px-3">
        <span className="display text-2xl tracking-[0.3em]">LUMEN</span>
        <span className="text-[10px] uppercase tracking-luxe text-muted">Admin</span>
      </Link>
      <nav className="mt-10 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition", active ? "bg-ink text-canvas" : "text-ink/70 hover:bg-sunken hover:text-ink")}
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-1">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink/70 hover:bg-sunken hover:text-ink">
          <ArrowUpRight className="h-4 w-4" /> View storefront
        </Link>
        <button onClick={toggle} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink/70 hover:bg-sunken hover:text-ink">
          <Moon className="h-4 w-4 dark:hidden" />
          <Sun className="hidden h-4 w-4 dark:block" /> Appearance
        </button>
        {user && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-xs text-canvas">{initials(user.name)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-[11px] text-muted">{user.email}</p>
            </div>
            <button
              onClick={async () => {
                await logout();
                router.push("/login");
              }}
              className="rounded-lg p-1.5 text-muted hover:bg-sunken hover:text-ink"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-surface/60 p-5 lg:flex">{nav}</aside>

      <div className="glass sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line px-4 lg:hidden">
        <button onClick={() => setOpen(true)} className="rounded-full p-2 hover:bg-sunken" aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </button>
        <span className="display text-xl tracking-[0.3em]">LUMEN</span>
        <span className="w-9" />
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 animate-slide-in-left flex-col bg-canvas p-5 shadow-lift">
            <button onClick={() => setOpen(false)} className="absolute right-4 top-4 rounded-full p-2 hover:bg-sunken" aria-label="Close navigation">
              <X className="h-5 w-5" />
            </button>
            {nav}
          </aside>
        </div>
      )}

      <main className="px-4 py-8 sm:px-6 lg:ml-64 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="display text-4xl sm:text-5xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
