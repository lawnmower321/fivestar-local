"use client";

import { useState, useTransition } from "react";
import { deleteBusinessAction } from "@/app/admin/actions";

export function DeleteBusiness({
  businessId,
  businessName,
  reviewCount,
}: {
  businessId: string;
  businessName: string;
  reviewCount: number;
}) {
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const armed = confirm === businessName;

  const del = () =>
    start(async () => {
      setError(null);
      const res = await deleteBusinessAction(businessId);
      // Success redirects server-side; only a failure returns here.
      if (res?.error) setError(res.error);
    });

  return (
    <section className="rounded-2xl border border-gred/40 bg-gred/5 p-6">
      <h2 className="font-heading text-lg font-bold text-gred">Danger zone</h2>
      <p className="mt-2 text-sm text-slate-600">
        Type <span className="font-semibold text-slate-800">&ldquo;{businessName}&rdquo;</span> to
        enable deletion. This permanently removes the business and all {reviewCount} of its review
        records.
      </p>
      <input
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder={businessName}
        className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gred"
      />
      <button
        disabled={!armed || pending}
        onClick={del}
        className="mt-3 rounded-lg bg-gred px-4 py-2 text-sm font-medium text-white hover:bg-gred/90 disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete this business"}
      </button>
      {error && <p className="mt-3 text-sm text-gred">{error}</p>}
    </section>
  );
}
