"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

/** Thumbnail rail + main image with hover-to-zoom (desktop) and swipeable arrows (mobile). */
export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");

  const move = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  };
  const go = (d: number) => setActive((a) => (a + d + images.length) % images.length);

  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row lg:gap-4">
      <div className="scrollbar-none flex gap-2 overflow-x-auto lg:w-20 lg:flex-col lg:gap-3">
        {images.map((src, i) => (
          <button
            key={src + i}
            onClick={() => setActive(i)}
            aria-label={`View image ${i + 1}`}
            className={cn(
              "shrink-0 overflow-hidden rounded-xl ring-1 ring-offset-2 ring-offset-canvas transition",
              i === active ? "ring-ink" : "ring-transparent opacity-60 hover:opacity-100"
            )}
          >
            <img src={src} alt="" className="h-24 w-[76px] object-cover lg:h-[100px] lg:w-20" />
          </button>
        ))}
      </div>

      <div
        className={cn("group relative flex-1 overflow-hidden rounded-3xl bg-sunken", zoom ? "cursor-zoom-out" : "cursor-zoom-in")}
        onMouseMove={move}
        onMouseEnter={() => window.matchMedia("(hover:hover)").matches && setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onClick={() => setZoom((z) => !z)}
      >
        <img
          key={active}
          src={images[active]}
          alt={`${title} — image ${active + 1}`}
          className="aspect-[4/5] w-full animate-fade-in object-cover transition-transform duration-300 ease-out"
          style={{ transform: zoom ? "scale(2)" : "scale(1)", transformOrigin: origin }}
        />
        <span className="glass pointer-events-none absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] opacity-100 transition group-hover:opacity-0">
          <ZoomIn className="h-3.5 w-3.5" /> Hover to zoom
        </span>
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 flex gap-2 lg:opacity-0 lg:transition lg:group-hover:opacity-100">
            <button onClick={(e) => { e.stopPropagation(); go(-1); }} className="glass grid h-10 w-10 place-items-center rounded-full shadow-soft" aria-label="Previous image">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); go(1); }} className="glass grid h-10 w-10 place-items-center rounded-full shadow-soft" aria-label="Next image">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
