"use client";

import { useState, useTransition } from "react";
import { updateClientDetailsAction } from "@/app/admin/actions";
import { STATUSES, type ClientStatus } from "@/lib/crm/status";
import type { Business } from "@/lib/replydesk/types";

const FIELD =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gblue";

export function ClientDetailsForm({ business }: { business: Business }) {
  const [status, setStatus] = useState<ClientStatus>(business.status);
  const [contactName, setContactName] = useState(business.contactName ?? "");
  const [contactEmail, setContactEmail] = useState(business.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(business.contactPhone ?? "");
  const [reviewUrl, setReviewUrl] = useState(business.reviewUrl ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = () =>
    start(async () => {
      setMsg(null);
      setErr(null);
      try {
        const res = await updateClientDetailsAction(business.id, {
          status, contactName, contactEmail, contactPhone, reviewUrl,
        });
        if (res?.error) setErr(res.error);
        else setMsg("Saved.");
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Save failed — try again.");
      }
    });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="font-heading text-lg font-bold text-slate-900">Details</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-slate-600">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ClientStatus)}
            className={`${FIELD} capitalize`}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Contact name
          <input value={contactName} onChange={(e) => setContactName(e.target.value)} className={FIELD} />
        </label>
        <label className="text-sm text-slate-600">
          Contact email
          <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={FIELD} />
        </label>
        <label className="text-sm text-slate-600">
          Contact phone
          <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={FIELD} />
        </label>
        <label className="text-sm text-slate-600 sm:col-span-2">
          Google review link
          <input
            value={reviewUrl}
            onChange={(e) => setReviewUrl(e.target.value)}
            placeholder="https://g.page/r/…"
            className={FIELD}
          />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={pending}
          className="rounded-lg bg-gblue px-4 py-2 text-sm font-medium text-white hover:bg-gblue/90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save details"}
        </button>
        {msg && <p className="text-sm text-ggreen">{msg}</p>}
        {err && <p className="text-sm text-gred">{err}</p>}
      </div>
    </section>
  );
}
