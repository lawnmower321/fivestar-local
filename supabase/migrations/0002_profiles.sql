-- Phase 1: founder profiles for attribution (display names).
-- auth.users is not exposed to PostgREST, so anything that must display
-- "who did this" joins this table instead.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null
);

alter table profiles enable row level security;
-- No policies on purpose: server code uses the service-role key (bypasses
-- RLS) and the browser never talks to the data API. RLS-on/zero-policies
-- means the Data API can't read this table at all.
