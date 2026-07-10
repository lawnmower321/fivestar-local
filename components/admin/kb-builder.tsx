"use client";

import { useState, useTransition } from "react";
import type { Business } from "@/lib/replydesk/types";
import {
  buildKbFromUrlAction, buildKbFromTextAction, extractVoiceAction,
  saveKbAction, saveVoiceAction,
} from "@/app/admin/actions";

type Tab = "url" | "paste" | "voice";

export function KbBuilder({ business }: { business: Business }) {
  const [tab, setTab] = useState<Tab>("url");
  const [url, setUrl] = useState("");
  const [raw, setRaw] = useState("");
  const [pastReplies, setPastReplies] = useState("");
  const [kb, setKb] = useState(business.kbMd);
  const [voice, setVoice] = useState(business.voiceMd);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<void>) =>
    start(async () => {
      setStatus(null);
      try { await fn(); }
      catch (e) { setStatus(e instanceof Error ? e.message : "Something went wrong — try again."); }
    });

  const tabClass = (t: Tab) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium ${tab === t ? "bg-gblue text-white" : "text-slate-600 hover:bg-slate-100"}`;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="font-heading text-lg font-bold text-slate-900">Knowledgebase</h2>

      <div className="mt-4 flex gap-2">
        <button className={tabClass("url")} onClick={() => setTab("url")}>From website</button>
        <button className={tabClass("paste")} onClick={() => setTab("paste")}>From pasted info</button>
        <button className={tabClass("voice")} onClick={() => setTab("voice")}>Voice from past replies</button>
      </div>

      {tab === "url" && (
        <div className="mt-4 flex gap-2">
          <input value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="https://their-website.com"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gblue" />
          <button disabled={pending || !url}
            onClick={() => run(async () => setKb(await buildKbFromUrlAction(business.id, url)))}
            className="rounded-lg bg-gblue px-4 py-2 text-sm font-medium text-white hover:bg-gblue/90 disabled:opacity-50">
            {pending ? "Reading site…" : "Build KB"}
          </button>
        </div>
      )}

      {tab === "paste" && (
        <div className="mt-4 space-y-2">
          <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={5}
            placeholder="Paste anything the owner told you: services, hours, staff names, specialties…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gblue" />
          <button disabled={pending || !raw}
            onClick={() => run(async () => setKb(await buildKbFromTextAction(business.id, raw)))}
            className="rounded-lg bg-gblue px-4 py-2 text-sm font-medium text-white hover:bg-gblue/90 disabled:opacity-50">
            {pending ? "Distilling…" : "Build KB"}
          </button>
        </div>
      )}

      {tab === "voice" && (
        <div className="mt-4 space-y-2">
          <textarea value={pastReplies} onChange={(e) => setPastReplies(e.target.value)} rows={5}
            placeholder="Paste their past review replies, one per line…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gblue" />
          <button disabled={pending || !pastReplies}
            onClick={() => run(async () => setVoice(await extractVoiceAction(business.id, pastReplies)))}
            className="rounded-lg bg-gblue px-4 py-2 text-sm font-medium text-white hover:bg-gblue/90 disabled:opacity-50">
            {pending ? "Analyzing voice…" : "Extract voice profile"}
          </button>
        </div>
      )}

      {status && <p className="mt-3 text-sm text-gred">{status}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Knowledgebase (editable)</h3>
            <button disabled={pending}
              onClick={() => run(async () => { await saveKbAction(business.id, kb); setStatus("KB saved."); })}
              className="text-sm font-medium text-gblue hover:underline disabled:opacity-50">
              Save KB
            </button>
          </div>
          <textarea value={kb} onChange={(e) => setKb(e.target.value)} rows={14}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs outline-none focus:border-gblue" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Voice profile (editable)</h3>
            <button disabled={pending}
              onClick={() => run(async () => { await saveVoiceAction(business.id, voice); setStatus("Voice saved."); })}
              className="text-sm font-medium text-gblue hover:underline disabled:opacity-50">
              Save voice
            </button>
          </div>
          <textarea value={voice} onChange={(e) => setVoice(e.target.value)} rows={14}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs outline-none focus:border-gblue" />
        </div>
      </div>
    </section>
  );
}
