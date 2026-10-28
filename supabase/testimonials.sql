-- Testimonials ("We worked together?") for the home page.
-- Run once in Supabase: SQL Editor > New query > paste > Run.
-- Visitors can only submit; a note shows on the site after you set approved = true
-- (Table Editor > testimonials > tick "approved").

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(trim(name)) between 2 and 60),
  role text check (role is null or char_length(role) <= 80),
  relation text not null default 'colleague'
    check (relation in ('colleague', 'manager', 'client', 'teammate')),
  message text not null check (char_length(trim(message)) between 20 and 500),
  approved boolean not null default false
);

alter table public.testimonials enable row level security;

-- Anyone can read approved notes only.
drop policy if exists "Read approved testimonials" on public.testimonials;
create policy "Read approved testimonials"
  on public.testimonials for select
  to anon
  using (approved = true);

-- Anyone can submit, but never pre-approved.
drop policy if exists "Submit testimonials for review" on public.testimonials;
create policy "Submit testimonials for review"
  on public.testimonials for insert
  to anon
  with check (approved = false);

-- No update/delete policies: only you (from the dashboard) can edit or remove rows.
