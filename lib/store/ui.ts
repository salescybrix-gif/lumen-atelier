"use client";
import { create } from "zustand";
import type { ProductSummary } from "@/types";

export type ToastTone = "default" | "success" | "error";
export interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
  action?: { label: string; href: string };
}

interface UIState {
  quickView: ProductSummary | null;
  openQuickView: (p: ProductSummary | null) => void;
  mobileNav: boolean;
  setMobileNav: (v: boolean) => void;
  toasts: Toast[];
  toast: (t: Omit<Toast, "id" | "tone"> & { tone?: ToastTone }) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useUI = create<UIState>()((set, get) => ({
  quickView: null,
  openQuickView: (p) => set({ quickView: p }),
  mobileNav: false,
  setMobileNav: (v) => set({ mobileNav: v }),
  toasts: [],
  toast: (t) => {
    const id = nextId++;
    set({ toasts: [...get().toasts.slice(-3), { tone: "default", ...t, id }] });
    setTimeout(() => get().dismiss(id), 4200);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

/** Shorthand usable outside React components. */
export const toast = (t: Parameters<UIState["toast"]>[0]) => useUI.getState().toast(t);
