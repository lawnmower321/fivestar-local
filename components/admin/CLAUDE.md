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
- admin-sidebar.tsx — shadcn sidebar nav (Clients + logout); active state
  via usePathname. New entries appear as phases ship.
- status-badge.tsx — ClientStatus → themed Badge; the single source of
  status badge classes (list rows + client-record header).
- client-tabs.tsx — Overview/ReplyDesk tab links for the client record;
  active by exact pathname match.
- client-details-form.tsx — status select + contact/review-link fields;
  calls updateClientDetailsAction, renders its {error} inline.
