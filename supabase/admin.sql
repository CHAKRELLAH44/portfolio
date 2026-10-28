-- Moderation rights for admin.html. Run once, after testimonials.sql:
-- SQL Editor > New query > paste > Run.

-- Who may moderate. Filled in by the last statement below.
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
-- RLS on with no policies: nobody can read or change this table through the API.
alter table public.admins enable row level security;

-- Runs with the owner's rights so policies can check the admins table.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

drop policy if exists "Admins read all testimonials" on public.testimonials;
create policy "Admins read all testimonials"
  on public.testimonials for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins approve testimonials" on public.testimonials;
create policy "Admins approve testimonials"
  on public.testimonials for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins delete testimonials" on public.testimonials;
create policy "Admins delete testimonials"
  on public.testimonials for delete
  to authenticated
  using (public.is_admin());

-- Make yourself admin: first create your user in Authentication > Users > Add user,
-- then replace the email below with that user's email and run this line.
insert into public.admins (user_id)
select id from auth.users where email = 'admin@imanska.dev'
on conflict do nothing;
