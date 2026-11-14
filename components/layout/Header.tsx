"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LayoutDashboard, LogOut, Menu, Moon, Search, ShoppingBag, Sun, User, X } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { useCart, cartCount } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";
import { useSession } from "@/lib/store/session";
import { useUI, toast } from "@/lib/store/ui";
import { useMounted, useScrollLock } from "@/lib/hooks";
import { useTheme } from "./Providers";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/types";

const NAV = [
  { href: "/shop", label: "Shop all" },
  { href: "/shop?category=Outerwear,Knitwear", label: "Clothing" },
  { href: "/shop?category=Bags", label: "Bags" },
  { href: "/shop?category=Fragrance", label: "Fragrance" },
  { href: "/shop?category=Objects", label: "Objects" },
];

export function Header() {
  const mounted = useMounted();
  const pathname = usePathname();
  const items = useCart((s) => s.items);
  const setCartOpen = useCart((s) => s.setOpen);
  const wish = useWishlist((s) => s.items.length);
  const { user, logout } = useSession();
  const { mobileNav, setMobileNav } = useUI();
  const { toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  useScrollLock(mobileNav);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  useEffect(() => {
    setMobileNav(false);
    setMenu(false);
    setMobileSearch(false);
  }, [pathname, setMobileNav]);

  const count = mounted ? cartCount(items) : 0;
  const onHome = pathname === "/";

  return (
    <>
      <div className="bg-ink py-2 text-center text-[11px] tracking-[0.18em] text-canvas/90">
        COMPLIMENTARY SHIPPING ON ORDERS OVER ₹15,000 · FREE 30-DAY RETURNS
      </div>
      <header
        className={cn(
          "sticky top-0 z-40 transition-all duration-300",
          scrolled || !onHome ? "glass border-b border-line/70" : "border-b border-transparent bg-canvas"
        )}
      >
        <div className="container-x flex h-16 items-center gap-4 lg:h-[72px]">
          <button className="-ml-2 rounded-full p-2 lg:hidden" onClick={() => setMobileNav(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>

          <nav className="hidden flex-1 items-center gap-7 lg:flex">
            {NAV.map((n) => (
              <Link key={n.label} href={n.href} className="link-underline text-[13px] text-ink/80 transition hover:text-ink">
                {n.label}
              </Link>
            ))}
          </nav>

          <Link href="/" className="flex-1 text-center lg:flex-none" aria-label="Lumen Atelier home">
            <span className="display text-[26px] tracking-[0.32em] lg:text-[30px]">LUMEN</span>
          </Link>

          <div className="flex flex-1 items-center justify-end gap-1">
            <SearchBar className="mr-2 hidden w-64 xl:block" />
            <button className="rounded-full p-2.5 transition hover:bg-sunken xl:hidden" onClick={() => setMobileSearch((v) => !v)} aria-label="Search">
              <Search className="h-[18px] w-[18px]" />
            </button>
            <button onClick={toggle} className="hidden rounded-full p-2.5 transition hover:bg-sunken sm:block" aria-label="Toggle dark mode">
              <Sun className="hidden h-[18px] w-[18px] dark:block" />
              <Moon className="h-[18px] w-[18px] dark:hidden" />
            </button>

            <div className="relative hidden sm:block">
              {user ? (
                <button onClick={() => setMenu((m) => !m)} className="rounded-full p-2.5 transition hover:bg-sunken" aria-label="Account menu">
                  <User className="h-[18px] w-[18px]" />
                </button>
              ) : (
                <Link href="/login" className="block rounded-full p-2.5 transition hover:bg-sunken" aria-label="Sign in">
                  <User className="h-[18px] w-[18px]" />
                </Link>
              )}
              {menu && user && (
                <div className="glass absolute right-0 top-12 z-50 w-60 animate-scale-in rounded-2xl border border-line p-2 shadow-lift">
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                  <div className="my-1 h-px bg-line" />
                  <MenuLink href="/account" icon={<User className="h-4 w-4" />}>
                    My account
                  </MenuLink>
                  <MenuLink href="/account?tab=wishlist" icon={<Heart className="h-4 w-4" />}>
                    Wishlist
                  </MenuLink>
                  {user.role === "admin" && (
                    <MenuLink href="/admin" icon={<LayoutDashboard className="h-4 w-4" />}>
                      Admin dashboard
                    </MenuLink>
                  )}
                  <button
                    onClick={async () => {
                      await logout();
                      setMenu(false);
                      toast({ title: "Signed out", description: "See you soon." });
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink/80 transition hover:bg-sunken hover:text-ink"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>

            <Link href="/account?tab=wishlist" className="relative hidden rounded-full p-2.5 transition hover:bg-sunken sm:block" aria-label="Wishlist">
              <Heart className="h-[18px] w-[18px]" />
              {mounted && wish > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />}
            </Link>
            <button onClick={() => setCartOpen(true)} className="relative rounded-full p-2.5 transition hover:bg-sunken" aria-label={`Shopping bag, ${count} items`}>
              <ShoppingBag className="h-[18px] w-[18px]" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] animate-scale-in place-items-center rounded-full bg-ink px-1 text-[10px] font-semibold text-canvas">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
        {mobileSearch && (
          <div className="container-x animate-fade-in pb-4 xl:hidden">
            <SearchBar autoFocus onNavigate={() => setMobileSearch(false)} />
          </div>
        )}
      </header>

      {mobileNav && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={() => setMobileNav(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm animate-slide-in-left flex-col bg-canvas shadow-lift">
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <span className="display text-2xl tracking-[0.3em]">LUMEN</span>
              <button onClick={() => setMobileNav(false)} className="rounded-full p-2 hover:bg-sunken" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-5 py-6">
              <p className="eyebrow mb-3">Shop</p>
              {[{ href: "/shop", label: "Shop all" }, ...CATEGORIES.map((c) => ({ href: `/shop?category=${c}`, label: c }))].map((n) => (
                <Link key={n.label} href={n.href} onClick={() => setMobileNav(false)} className="display block py-2.5 text-[28px] leading-tight">
                  {n.label}
                </Link>
              ))}
              <div className="my-6 h-px bg-line" />
              <div className="space-y-1 text-sm">
                {user ? (
                  <>
                    <Link href="/account" onClick={() => setMobileNav(false)} className="block py-2">My account</Link>
                    {user.role === "admin" && <Link href="/admin" onClick={() => setMobileNav(false)} className="block py-2">Admin dashboard</Link>}
                    <button onClick={() => logout()} className="block py-2 text-muted">Sign out</button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileNav(false)} className="block py-2">Sign in</Link>
                    <Link href="/register" onClick={() => setMobileNav(false)} className="block py-2">Create account</Link>
                  </>
                )}
                <Link href="/account?tab=wishlist" onClick={() => setMobileNav(false)} className="block py-2">Wishlist</Link>
                <button onClick={toggle} className="flex items-center gap-2 py-2">
                  <Moon className="h-4 w-4 dark:hidden" />
                  <Sun className="hidden h-4 w-4 dark:block" />
                  Toggle appearance
                </button>
              </div>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}

function MenuLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink/80 transition hover:bg-sunken hover:text-ink">
      {icon}
      {children}
    </Link>
  );
}
