"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useSession } from "@/lib/store/session";
import { toast } from "@/lib/store/ui";

function DeniedNotice() {
  const params = useSearchParams();
  useEffect(() => {
    if (params.get("denied")) toast({ title: "Admins only", description: "You need an admin account to open the dashboard.", tone: "error" });
  }, [params]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const refresh = useSession((s) => s.refresh);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return (
    <>
      <Suspense fallback={null}>
        <DeniedNotice />
      </Suspense>
      {children}
    </>
  );
}

export function useTheme() {
  const toggle = () => {
    const dark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("lumen-theme", dark ? "dark" : "light");
    } catch {}
  };
  return { toggle };
}
