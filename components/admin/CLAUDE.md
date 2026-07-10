# components/admin — ReplyDesk client components

Interactive pieces of the admin console. They call server actions from
app/admin/actions.ts and hold only view state — no business rules here.

MAP
- kb-builder.tsx — 3-tab KB builder (URL / pasted info / voice from past
  replies) + editable KB & voice textareas with explicit Save.
- reply-workspace.tsx — paste review → generate → gate verdict → copy →
  mark posted. Gate verdicts come from the server; this component only
  renders them (hardFail = red, never copy-ready; soft flags = amber).
