-- Phase 2: businesses rows are client records — status + contact details.
alter table businesses
  add column if not exists status text not null default 'lead'
    check (status in ('lead','active','paused','churned')),
  add column if not exists contact_name text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text;
