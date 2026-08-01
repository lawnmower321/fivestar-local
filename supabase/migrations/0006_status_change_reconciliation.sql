-- Fixes the status_change retry-loss bug flagged by the phase 3 whole-branch
-- review: a status update can commit while its status_change activity write
-- fails, and a retry re-reads the already-updated status so the activity is
-- never written. This column persists the outstanding {from,to} transition
-- alongside the status write (same UPDATE statement, so it's atomic with
-- it), letting the next action call flush it before evaluating anything new.
alter table businesses
  add column if not exists pending_status_change jsonb;
