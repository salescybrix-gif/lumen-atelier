"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Stars } from "@/components/ui/misc";
import { useSession, post } from "@/lib/store/session";
import { toast } from "@/lib/store/ui";
import { cn, formatDate } from "@/lib/utils";
import type { Review } from "@/types";

export function Reviews({ slug, initial }: { slug: string; initial: Review[] }) {
  const user = useSession((s) => s.user);
  const [reviews, setReviews] = useState(initial);
  const [filter, setFilter] = useState<number | null>(null);
  const [sort, setSort] = useState<"recent" | "high" | "low">("recent");
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, count: reviews.filter((r) => r.rating === n).length }));
  const verifiedPct = reviews.length ? Math.round((reviews.filter((r) => r.verified).length / reviews.length) * 100) : 0;

  const list = useMemo(() => {
    const l = reviews.filter((r) => !filter || r.rating === filter);
    return l.sort((a, b) =>
      sort === "recent" ? +new Date(b.createdAt) - +new Date(a.createdAt) : sort === "high" ? b.rating - a.rating : a.rating - b.rating
    );
  }, [reviews, filter, sort]);
  const visible = showAll ? list : list.slice(0, 4);

  return (
    <section id="reviews" className="border-t border-line pt-16">
      <div className="grid gap-12 lg:grid-cols-[340px_1fr] lg:gap-20">
        <div>
          <p className="eyebrow">Reviews</p>
          <h2 className="display mt-3 text-4xl">Client notes</h2>
          <div className="mt-8 flex items-end gap-4">
            <span className="display text-7xl leading-none">{avg.toFixed(1)}</span>
            <div className="pb-2">
              <Stars value={avg} size={16} />
              <p className="mt-1 text-xs text-muted">{reviews.length} reviews · {verifiedPct}% verified</p>
            </div>
          </div>
          <div className="mt-8 space-y-2.5">
            {dist.map(({ n, count }) => (
              <button
                key={n}
                onClick={() => setFilter(filter === n ? null : n)}
                className={cn("group flex w-full items-center gap-3 text-xs transition", filter && filter !== n && "opacity-40")}
              >
                <span className="w-3 text-muted">{n}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken">
                  <span className="block h-full rounded-full bg-ink transition-all duration-700" style={{ width: `${reviews.length ? (count / reviews.length) * 100 : 0}%` }} />
                </span>
                <span className="w-6 text-right tabular-nums text-muted">{count}</span>
              </button>
            ))}
          </div>
          <Button variant="outline" className="mt-8 w-full" onClick={() => (user ? setOpen(true) : null)} href={user ? undefined : `/login?next=/product/${slug}`}>
            Write a review
          </Button>
        </div>

        <div>
          <div className="mb-6 flex items-center justify-between border-b border-line pb-4">
            <p className="text-sm text-muted">
              {filter ? `Showing ${filter}-star reviews` : `Showing ${list.length} reviews`}
              {filter && (
                <button onClick={() => setFilter(null)} className="ml-2 underline underline-offset-4 hover:text-ink">
                  Clear
                </button>
              )}
            </p>
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="bg-transparent text-sm focus:outline-none">
              <option value="recent">Most recent</option>
              <option value="high">Highest rated</option>
              <option value="low">Lowest rated</option>
            </select>
          </div>
          <ul className="divide-y divide-line">
            {visible.map((r) => (
              <li key={r.id} className="animate-fade-in py-7">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Stars value={r.rating} size={13} />
                  <span className="text-xs text-muted">{formatDate(r.createdAt)}</span>
                </div>
                <p className="mt-3 font-medium">{r.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink/75">{r.body}</p>
                <p className="mt-4 flex items-center gap-2 text-xs text-muted">
                  {r.author}
                  {r.verified && (
                    <span className="inline-flex items-center gap-1 text-success">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified buyer
                    </span>
                  )}
                </p>
              </li>
            ))}
          </ul>
          {list.length > 4 && (
            <Button variant="ghost" className="mt-2" onClick={() => setShowAll((s) => !s)}>
              {showAll ? "Show fewer" : `Show all ${list.length} reviews`}
            </Button>
          )}
        </div>
      </div>
      <ReviewForm
        open={open}
        onClose={() => setOpen(false)}
        slug={slug}
        onCreated={(r) => {
          setReviews((rs) => [r, ...rs]);
          setFilter(null);
          setSort("recent");
        }}
      />
      {!user && (
        <p className="mt-6 text-center text-xs text-muted lg:hidden">
          <Link href="/login" className="underline">Sign in</Link> to leave a review.
        </p>
      )}
    </section>
  );
}

function ReviewForm({ open, onClose, slug, onCreated }: { open: boolean; onClose: () => void; slug: string; onCreated: (r: Review) => void }) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { review } = await post<{ review: Review }>(`/api/products/${slug}/reviews`, { rating, title, body });
      onCreated(review);
      toast({ title: "Thank you for your review", description: review.verified ? "Marked as a verified purchase." : undefined, tone: "success" });
      setTitle("");
      setBody("");
      onClose();
    } catch (err) {
      toast({ title: (err as Error).message, tone: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Write a review" description="Share your experience to help other clients." size="md">
      <form onSubmit={submit} className="space-y-5 p-6 sm:p-8">
        <div>
          <p className="mb-2 text-xs font-medium text-muted">Your rating</p>
          <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onMouseEnter={() => setHover(n)} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                <Stars value={(hover || rating) >= n ? 1 : 0} size={26} className="[&>span:not(:first-child)]:hidden" />
              </button>
            ))}
          </div>
        </div>
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summarise your experience" required />
        <Textarea label="Review" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Fit, materials, how you wear it…" required minLength={10} />
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Submit review
        </Button>
      </form>
    </Modal>
  );
}
