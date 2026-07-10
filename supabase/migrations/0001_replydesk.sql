-- ReplyDesk schema. Run in Supabase SQL editor (or `supabase db push` if CLI linked).
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  review_url text,
  kb_md text not null default '',
  voice_md text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  reviewer text,
  review_text text not null,
  reply_text text,
  detail_referenced text,
  similarity real,
  flags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','posted')),
  created_at timestamptz not null default now(),
  posted_at timestamptz
);

create index if not exists reviews_business_idx on reviews (business_id, created_at desc);

-- RLS on with no policies: anon/authenticated keys can read nothing.
-- The app uses the service-role key server-side, which bypasses RLS.
alter table businesses enable row level security;
alter table reviews enable row level security;
