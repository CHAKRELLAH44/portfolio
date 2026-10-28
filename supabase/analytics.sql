-- Anonymous visit analytics for the admin dashboard. Run once, after admin.sql:
-- SQL Editor > New query > paste > Run.
-- Stores no IP address and no persistent visitor id: a session id lives only
-- for one browser tab session (sessionStorage).

create table if not exists public.events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  session_id text not null check (char_length(session_id) between 8 and 40),
  type text not null check (type in ('view', 'leave', 'cv', 'contact', 'share', 'outbound', 'testimonial', 'game')),
  page text check (char_length(page) <= 80),
  referrer text check (char_length(referrer) <= 200),
  source text check (char_length(source) <= 40),
  ref text check (char_length(ref) <= 40),
  device text check (device in ('mobile', 'tablet', 'desktop')),
  browser text check (char_length(browser) <= 30),
  os text check (char_length(os) <= 30),
  lang text check (char_length(lang) <= 12),
  timezone text check (char_length(timezone) <= 60),
  screen text check (char_length(screen) <= 15),
  duration_ms integer check (duration_ms between 0 and 86400000),
  scroll_pct smallint check (scroll_pct between 0 and 100),
  detail text check (char_length(detail) <= 120)
);

create index if not exists events_created_at_idx on public.events (created_at desc);

alter table public.events enable row level security;

-- Visitors' browsers may only add events.
drop policy if exists "Anyone can log events" on public.events;
create policy "Anyone can log events"
  on public.events for insert
  to anon, authenticated
  with check (true);

-- Only admins (see admin.sql) can read or clear them.
drop policy if exists "Admins read events" on public.events;
create policy "Admins read events"
  on public.events for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins delete events" on public.events;
create policy "Admins delete events"
  on public.events for delete
  to authenticated
  using (public.is_admin());
