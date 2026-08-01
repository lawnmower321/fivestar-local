"use client";

import { useState, useTransition } from "react";
import type { Business, Review } from "@/lib/replydesk/types";
import { generateReplyAction, markPostedAction } from "@/app/admin/actions";

type Draft = {
  reviewId: string; reply: string; detailReferenced: string;
  ok: boolean; hardFail: boolean; reasons: string[]; attempts: number;
};

export function ReplyWorkspace({ business, reviews }: { business: Business; reviews: Review[] }) {
  const [rating, setRating] = useState(5);
  const [reviewer, setReviewer] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  const generate = () =>
    start(async () => {
      setError(null); setDraft(null); setCopied(false);
      try {
        setDraft(await generateReplyAction({ businessId: business.id, rating, reviewer, reviewText }));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Generation failed — the review text is kept, try again.");
      }
    });

  const copyAndMark = (d: Draft) =>
    start(async () => {
      setError(null);
      try {
        await navigator.clipboard.writeText(d.reply);
        await markPostedAction(d.reviewId, business.id);
        // Only confirm once both the copy and the mark-posted have succeeded.
        setCopied(true);
      } catch (e) {
        setError(
          e instanceof Error
            ? `Couldn't copy or mark posted: ${e.message} — the draft is kept, try again.`
            : "Couldn't copy or mark posted — the draft is kept, try again.",
        );
      }
    });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="font-heading text-lg font-bold text-slate-900">Reply workspace</h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-[6rem_1fr]">
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))}
          className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
        </select>
        <input value={reviewer} onChange={(e) => setReviewer(e.target.value)}
          placeholder="Reviewer name (optional)"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gblue" />
      </div>
      <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={4}
        placeholder="Paste the Google review text here…"
        className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gblue" />
      <button disabled={pending || !reviewText.trim()} onClick={generate}
        className="mt-3 rounded-lg bg-gblue px-4 py-2 text-sm font-medium text-white hover:bg-gblue/90 disabled:opacity-50">
        {pending ? "Writing…" : "Generate reply"}
      </button>

      {error && <p className="mt-3 text-sm text-gred">{error}</p>}

      {draft && (
        <div className={`mt-5 rounded-xl border p-4 ${
          draft.hardFail ? "border-gred/40 bg-gred/5"
          : draft.ok ? "border-ggreen/40 bg-ggreen/5"
          : "border-gyellow/60 bg-gyellow/10"}`}>
          <p className="whitespace-pre-wrap text-sm text-slate-800">{draft.reply}</p>
          <p className="mt-2 text-xs text-slate-500">
            Detail referenced: {draft.detailReferenced} · attempts: {draft.attempts}
          </p>
          {draft.reasons.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs font-medium text-slate-700">
              {draft.reasons.map((r) => <li key={r}>⚠ {r}</li>)}
            </ul>
          )}
          {draft.hardFail ? (
            <p className="mt-3 text-sm font-semibold text-gred">
              Blocked: contains contact info. Regenerate or edit by hand — do not post as-is.
            </p>
          ) : (
            <button disabled={pending} onClick={() => copyAndMark(draft)}
              className="mt-3 rounded-lg bg-ggreen px-4 py-2 text-sm font-medium text-white hover:bg-ggreen/90 disabled:opacity-50">
              {copied ? "Copied — marked posted ✓" : draft.ok ? "Copy reply & mark posted" : "Copy anyway (flagged) & mark posted"}
            </button>
          )}
        </div>
      )}

      <h3 className="mt-8 text-sm font-semibold text-slate-700">Recent reviews</h3>
      <ul className="mt-2 divide-y divide-slate-100">
        {reviews.length === 0 && <li className="py-3 text-sm text-slate-500">Nothing logged yet.</li>}
        {reviews.map((r) => (
          <li key={r.id} className="py-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                <span role="img" aria-label={`${r.rating} stars`}>
                  <span aria-hidden="true">{"★".repeat(r.rating)}</span>
                </span>
                {r.reviewer ? ` · ${r.reviewer}` : ""}
              </span>
              <span className={r.status === "posted" ? "text-ggreen" : "text-slate-400"}>{r.status}</span>
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-slate-700">{r.reviewText}</p>
            {r.replyText && <p className="mt-1 line-clamp-2 text-sm text-slate-500">↳ {r.replyText}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
