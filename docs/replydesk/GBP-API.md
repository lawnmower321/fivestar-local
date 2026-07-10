# Google Business Profile API — access application (HUMAN TASK)

Goal: programmatic review fetch + reply posting. Until approved, ReplyDesk is
paste-in / copy-out.

Checklist (founder does this in a browser; an agent cannot):
1. Create a Google Cloud project named `fivestar-local` (console.cloud.google.com).
2. Enable "Google My Business API" / "Business Profile Performance API".
3. Fill the GBP API access request form (search "Google Business Profile API
   access request"). Describe the business as: agency managing Google review
   engagement for local-business clients, with manager access to each client's
   profile. Use the hello@fivestarlocal.pro email.
4. Wait for approval email (days–weeks). Record the outcome here with a date.
5. When approved: file a new plan for `lib/replydesk/gbp/` (OAuth as manager,
   review polling, reply posting with per-business auto-post settings:
   auto-post 4–5★ that pass gates, queue ≤3★ for approval).

Status log:
- 2026-07-__ — application submitted (fill in when done)
