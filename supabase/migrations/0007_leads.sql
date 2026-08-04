-- Public marketing-site intake. Written only by submitLeadAction using the
-- service-role key. RLS on with zero policies, same as every other table
-- here: the publishable key can neither read nor write it, so a scraped
-- anon key exposes no prospect emails.
create table leads (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  email text not null,
  note text,
  source text not null default 'landing',
  created_at timestamptz not null default now()
);
alter table leads enable row level security;
create index leads_created_at_idx on leads (created_at desc);
