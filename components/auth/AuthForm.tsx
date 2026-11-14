"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Checkbox } from "@/components/ui/Input";
import { useSession } from "@/lib/store/session";
import { toast } from "@/lib/store/ui";
import { artUrl } from "@/lib/art";

// Demo accounts mirror lib/seed.ts (development data only).
const DEMO = {
  customer: { email: "demo@lumen.test", password: "demo123" },
  admin: { email: "admin@lumen.test", password: "admin123" },
};

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next");
  const { login, register } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = mode === "login" ? await login(email, password) : await register(name, email, password);
      toast({ title: mode === "login" ? `Welcome back, ${user.name.split(" ")[0]}` : "Your account is ready", tone: "success" });
      router.push(next && next.startsWith("/") ? next : user.role === "admin" ? "/admin" : "/account");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const social = (p: string) => toast({ title: `${p} sign-in isn't configured`, description: "Social login is a UI placeholder in this demo." });

  return (
    <div className="grid min-h-[calc(100vh-110px)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <img src={artUrl(mode === "login" ? "Outerwear" : "Knitwear", mode === "login" ? "#58606a" : "#c8b393", 1)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-0 p-12 text-white">
          <p className="display max-w-md text-5xl leading-tight">{mode === "login" ? "Welcome back to the atelier." : "Join the atelier."}</p>
          <p className="mt-3 max-w-sm text-sm text-white/75">Track orders, save addresses, keep a wishlist and receive private previews.</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-14 sm:px-8">
        <div className="w-full max-w-[400px] animate-fade-up">
          <h1 className="display text-5xl">{mode === "login" ? "Sign in" : "Create account"}</h1>
          <p className="mt-2 text-sm text-muted">
            {mode === "login" ? "New to Lumen? " : "Already have an account? "}
            <Link href={mode === "login" ? `/register${next ? `?next=${encodeURIComponent(next)}` : ""}` : `/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-ink underline underline-offset-4">
              {mode === "login" ? "Create an account" : "Sign in"}
            </Link>
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => social("Google")} type="button">
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z" />
                <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.7-4.9h-4v3.1A12 12 0 0 0 12 24z" />
                <path fill="#FBBC05" d="M5.3 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.9l4-3.1z" />
                <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
              </svg>
              Google
            </Button>
            <Button variant="outline" onClick={() => social("Apple")} type="button">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9a4.8 4.8 0 0 0-3.8-2c-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9a5 5 0 0 0-4.2 2.6c-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8s2 .8 3.4.8 2.2-1.3 3-2.5c1-1.4 1.4-2.8 1.4-2.9 0 0-2.6-1-2.5-4.1zM13.9 5c.7-.9 1.2-2 1-3.2-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3.1 1.1.1 2.2-.6 2.9-1.4z" />
              </svg>
              Apple
            </Button>
          </div>

          <div className="my-7 flex items-center gap-4 text-[11px] uppercase tracking-luxe text-muted">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />}
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            <div className="relative">
              <Input
                label="Password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                hint={mode === "register" ? "At least 8 characters." : undefined}
                required
                className="pr-12"
              />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-[34px] p-1.5 text-muted hover:text-ink" aria-label={show ? "Hide password" : "Show password"}>
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {mode === "login" && (
              <div className="flex items-center justify-between">
                <Checkbox label={<span className="text-xs">Remember me</span>} defaultChecked />
                <button type="button" onClick={() => toast({ title: "Password reset", description: "Email delivery isn't configured in this demo." })} className="text-xs text-muted underline-offset-4 hover:text-ink hover:underline">
                  Forgot password?
                </button>
              </div>
            )}
            {error && <p className="animate-fade-in rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
            <Button type="submit" size="lg" loading={loading} className="w-full">
              {mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>

          {mode === "login" && (
            <div className="mt-8 rounded-2xl border border-dashed border-line p-4">
              <p className="eyebrow mb-3">Demo accounts</p>
              <div className="grid grid-cols-2 gap-2">
                {(["customer", "admin"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setEmail(DEMO[k].email);
                      setPassword(DEMO[k].password);
                    }}
                    className="rounded-xl bg-sunken px-3 py-2.5 text-left text-xs transition hover:bg-line"
                  >
                    <span className="block font-medium capitalize">{k}</span>
                    <span className="text-muted">{DEMO[k].email}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
