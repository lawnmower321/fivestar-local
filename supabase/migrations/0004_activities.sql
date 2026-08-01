-- Phase 3: per-client activity timeline. Notes are activities of type
-- 'note' — one timeline, one table. RLS on, zero policies (service-role
-- access only, same as profiles).
create table activities (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  type text not null check (type in
    ('note','reply_posted','status_change','kb_updated','task_completed')),
  body text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
alter table activities enable row level security;
create index activities_business_created_idx on activities (business_id, created_at desc);
create index activities_user_idx on activities (user_id);
