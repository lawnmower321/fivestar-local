# app/admin — ReplyDesk web shell

Thin Next.js shell over lib/replydesk. UI + server actions only; no business
logic lives here.

INVARIANTS
- Every page under /admin (except login) assumes the layout guard ran: a valid Supabase Auth session (validated via getClaims()). proxy.ts refreshes session cookies for /admin/*; the (protected)/ layout owns the redirect guard.
- Server actions in actions.ts: construct real clients (getDb, getOpenRouter),
  call lib/replydesk functions, revalidatePath. They contain NO logic.
- Writer-carrying actions (markPostedAction, saveKbAction, saveVoiceAction,
  updateClientDetailsAction) insertActivity then revalidatePath(client path,
  "layout") so every tab under clients/[id] picks up the new row, not just
  the page that wrote it. addNoteAction/deleteNoteAction revalidate only the
  timeline route itself.
- Task actions (createTaskAction, setTaskStatusAction, deleteTaskAction)
  share revalidateTaskSurfaces: always revalidates /admin and /admin/tasks,
  plus the client layout when the task is business-linked.
- Server actions SELF-AUTHENTICATE: every action calls await requireUser() (require-user.ts) as its first statement and zod-parses its input (schemas.ts) before any DB/AI call; the login action is exempt. require-user.ts reads the session via the @supabase/ssr auth client (auth-client.ts) so it lives here in the shell, never in lib/replydesk (no next/* there).
- Secrets are read only inside server code. Nothing here is public marketing
  UI — but keep the same Tailwind design language as the site.

MAP
- login/ — email+password sign-in form (Supabase Auth signInWithPassword; the
  @supabase/ssr cookie adapter sets the session cookies, not the action). Lives
  OUTSIDE the (protected) route group so it renders without the guard and
  without a redirect loop.
- (protected)/layout.tsx — auth guard + shadcn sidebar shell (AdminSidebar +
  SidebarInset). A route group (no URL segment): everything placed inside it
  requires a valid session; login/ is a sibling, not a child, so it is never
  subject to this guard.
- (protected)/page.tsx — today-dashboard: tasks due today/overdue (via
  listAllTasks/bucketTasks) + cross-client recent activity feed
  (listRecentActivities), each activity row iconed via
  components/admin/activity-icons.ACTIVITY_ICONS (shared with the Timeline
  tab so the same data looks the same in both places).
- (protected)/tasks/page.tsx — cross-client task workflow view: same
  TaskForm/TaskItem/bucketTasks as the per-client tasks tab, but over
  listAllTasks with a client picker (listBusinesses) instead of a fixed
  businessId.
- (protected)/replydesk/page.tsx — "Reply queue" cross-client dashboard
  (sidebar label; the route itself is unchanged): recent posted replies
  (recentPostedAcrossClients, 20, joined business names) + a "needs
  attention" list (lib/crm/attention.buildAttention) for ACTIVE clients
  only, each linking to that client's actual ReplyDesk tab. Read-only — no
  server actions.
- (protected)/clients/page.tsx — client list: status filter chips, table,
  add-client form.
- (protected)/clients/[id]/layout.tsx — client header (name, status badge,
  review link) + tab links (Overview | ReplyDesk | Tasks | Timeline).
- (protected)/clients/[id]/page.tsx — Overview tab: details form + lead-only
  danger zone (churned guidance for non-leads; server enforces the guard).
- (protected)/clients/[id]/replydesk/page.tsx — KB builder + reply workspace
  (client components in components/admin/).
- (protected)/clients/[id]/tasks/page.tsx — Tasks tab: this client's tasks
  only (listTasksForBusiness), same TaskForm/TaskItem/bucketTasks buckets
  (Overdue/Today/Upcoming/Anytime/Done) as the cross-client view.
- (protected)/clients/[id]/timeline/page.tsx — Timeline tab: note composer
  + activity list (listActivities/listProfiles, rendered via
  lib/crm/timeline.activityLabel); only note-type rows get a delete button.
- (protected)/clients/not-found.tsx — "client not found" boundary for the
  whole clients/[id] subtree. Placed at the parent segment (not [id]/) on
  purpose: a segment's own not-found.js nests inside its layout, so a
  notFound() thrown by clients/[id]/layout.tsx only bubbles to an ancestor
  boundary. This one catches all sites under it (layout + all tab pages).
- Old /admin/businesses/:id URLs 307-redirect to /admin/clients/:id
  (next.config.ts redirects()).

See docs/replydesk/DECISIONS.md for why the guard lives in a route group
instead of a single shared layout keyed on a request-path header.
