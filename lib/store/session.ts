"use client";
import { create } from "zustand";
import type { PublicUser, SessionUser } from "@/types";

interface SessionState {
  user: SessionUser | null;
  profile: PublicUser | null;
  status: "loading" | "ready";
  refresh: () => Promise<void>;
  setProfile: (p: PublicUser) => void;
  login: (email: string, password: string) => Promise<SessionUser>;
  register: (name: string, email: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data as T;
}

export const useSession = create<SessionState>()((set, get) => ({
  user: null,
  profile: null,
  status: "loading",
  refresh: async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      set({ user: data.user, profile: data.profile, status: "ready" });
    } catch {
      set({ user: null, profile: null, status: "ready" });
    }
  },
  setProfile: (profile) => set({ profile, user: { id: profile.id, name: profile.name, email: profile.email, role: profile.role } }),
  login: async (email, password) => {
    const { user } = await post<{ user: SessionUser }>("/api/auth/login", { email, password });
    set({ user });
    await get().refresh();
    return user;
  },
  register: async (name, email, password) => {
    const { user } = await post<{ user: SessionUser }>("/api/auth/register", { name, email, password });
    set({ user });
    await get().refresh();
    return user;
  },
  logout: async () => {
    await post("/api/auth/logout", {});
    set({ user: null, profile: null });
  },
}));

export { post };
