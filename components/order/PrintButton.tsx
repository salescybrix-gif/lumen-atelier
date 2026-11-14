"use client";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="flex items-center justify-center gap-2 py-2 text-xs text-muted hover:text-ink">
      <Printer className="h-3.5 w-3.5" /> Print invoice
    </button>
  );
}
