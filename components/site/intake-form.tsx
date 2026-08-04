"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2 } from "lucide-react";
import { submitLeadAction } from "@/app/actions/leads";
import type { LeadResult } from "@/lib/leads/schema";
import { content } from "@/lib/content";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-star px-5 py-3 font-semibold text-ink transition-colors hover:bg-star/90 disabled:opacity-60"
    >
      {pending ? content.intake.submitting : content.intake.submit}
    </button>
  );
}

export function IntakeForm() {
  const [state, formAction] = useActionState<LeadResult | null, FormData>(submitLeadAction, null);

  if (state?.ok) {
    return (
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-6 py-5 text-left">
        <CheckCircle2 size={22} className="shrink-0 text-star" />
        <p className="text-white">{content.intake.success}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mx-auto max-w-md space-y-3 text-left">
      {/* Honeypot: visually hidden, never announced, never tab-reachable.
          A human cannot fill it; a naive bot fills everything. */}
      <div aria-hidden className="absolute h-px w-px overflow-hidden opacity-0">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="businessName" className="block text-sm font-medium text-white/80">
          {content.intake.businessLabel}
        </label>
        <input
          id="businessName"
          name="businessName"
          type="text"
          required
          maxLength={120}
          placeholder={content.intake.businessPlaceholder}
          className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:border-star focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white/80">
          {content.intake.emailLabel}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={160}
          placeholder={content.intake.emailPlaceholder}
          className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:border-star focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="note" className="block text-sm font-medium text-white/80">
          {content.intake.noteLabel}
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          maxLength={500}
          placeholder={content.intake.notePlaceholder}
          className="mt-1.5 w-full resize-none rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:border-star focus:outline-none"
        />
      </div>

      {state && !state.ok && (
        <p role="alert" className="text-sm text-star">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
