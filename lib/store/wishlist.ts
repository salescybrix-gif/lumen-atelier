"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductSummary } from "@/types";

interface WishlistState {
  items: ProductSummary[];
  toggle: (p: ProductSummary) => boolean; // returns true if now saved
  remove: (id: string) => void;
  has: (id: string) => boolean;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (p) => {
        const saved = get().items.some((i) => i.id === p.id);
        set({ items: saved ? get().items.filter((i) => i.id !== p.id) : [p, ...get().items] });
        return !saved;
      },
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      has: (id) => get().items.some((i) => i.id === id),
    }),
    { name: "lumen-wishlist-inr" }
  )
);
