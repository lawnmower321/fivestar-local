-- Phase 4: tasks & follow-ups. business_id nullable (general to-dos);
-- assignee null = "either of us". RLS on, zero policies (service-role only).
create table tasks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  assignee uuid references profiles(id) on delete set null,
  title text not null,
  due_date date,
  status text not null default 'open' check (status in ('open','done')),
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table tasks enable row level security;
create index tasks_business_idx on tasks (business_id);
create index tasks_assignee_idx on tasks (assignee);
create index tasks_created_by_idx on tasks (created_by);
create index tasks_status_due_idx on tasks (status, due_date);
