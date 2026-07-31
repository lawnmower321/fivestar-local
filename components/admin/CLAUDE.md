# components/admin — ReplyDesk client components

Interactive pieces of the admin console. They call server actions from
app/admin/actions.ts and hold only view state — no business rules here.

MAP
- kb-builder.tsx — 4-tab KB builder (URL / pasted info / voice from past
  replies / make-it-right policy) + editable KB & voice textareas with
  explicit Save. The policy tab merges founder text verbatim via
  lib/replydesk/kb-sections.ts; URL/paste rebuilds re-merge the existing
  policy so it survives (the KB model never emits that section).
- reply-workspace.tsx — paste review → generate → gate verdict → copy →
  mark posted. Gate verdicts come from the server; this component only
  renders them (hardFail = red, never copy-ready; soft flags = amber).
- delete-business.tsx — type-the-name hard delete danger zone. Lead-only:
  the Overview page hides it for non-leads and deleteBusinessAction refuses
  them server-side.
- admin-sidebar.tsx — shadcn sidebar nav (Dashboard, Clients, Tasks +
  logout); active state via usePathname (Dashboard: exact match on /admin
  so it isn't active on every /admin/* page; Clients/Tasks: prefix match).
  New entries appear as phases ship.
- activity-icons.ts — ACTIVITY_ICONS: one lucide icon per ActivityType,
  shared by the client Timeline tab and the /admin dashboard's recent
  activity list so the same activity data renders identically in both.
- status-badge.tsx — ClientStatus → themed Badge; the single source of
  status badge classes (list rows + client-record header).
- client-tabs.tsx — Overview/ReplyDesk/Timeline tab links for the client
  record; active by exact pathname match.
- client-details-form.tsx — status select + contact/review-link fields;
  calls updateClientDetailsAction, renders its {error} inline.
- note-composer.tsx — textarea + submit for addNoteAction; renders its
  thrown error inline, matching delete-business.tsx's convention.
- delete-note-button.tsx — per-note delete (X icon) for deleteNoteAction;
  renders its thrown error inline, same convention.
