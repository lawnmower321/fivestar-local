# app/admin — ReplyDesk web shell

Thin Next.js shell over lib/replydesk. UI + server actions only; no business
logic lives here.

INVARIANTS
- Every page under /admin (except login) assumes the layout guard ran:
  a valid rd_session cookie (sha256 of REPLYDESK_PASSCODE).
- Server actions in actions.ts: construct real clients (getDb, getOpenRouter),
  call lib/replydesk functions, revalidatePath. They contain NO logic.
- Server actions SELF-AUTHENTICATE: the (protected) layout guards page render
  only, not action POST endpoints, and there is no middleware. Every action in
  actions.ts calls `await requireSession()` (require-session.ts) as its first
  statement; the login action is exempt. require-session.ts reads cookies() so
  it lives here in the shell, never in lib/replydesk (no next/* there).
- Secrets are read only inside server code. Nothing here is public marketing
  UI — but keep the same Tailwind design language as the site.

MAP
- login/ — passcode form (sets cookie); lives OUTSIDE the (protected) route
  group so it renders without the guard and without a redirect loop.
- (protected)/layout.tsx — auth guard + nav. A route group (no URL segment):
  everything placed inside it requires a valid session; login/ is a sibling,
  not a child, so it is never subject to this guard.
- (protected)/page.tsx — business list + create (Task 6).
- (protected)/businesses/[id]/ — KB builder + reply workspace (client
  components in components/admin/) (Task 7/8).

See docs/replydesk/DECISIONS.md for why the guard lives in a route group
instead of a single shared layout keyed on a request-path header.
