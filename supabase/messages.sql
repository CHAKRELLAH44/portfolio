-- Contact conversations for the "Messages" tab of perso.html. Run once, after admin.sql:
-- SQL Editor > New query > paste > Run.
-- Each answer of the contact chat is saved as the visitor goes, so a conversation stays here even if
-- they stop before the end. status: draft (never finished), sent (FormSubmit confirmed it),
-- unconfirmed (FormSubmit did not confirm, the visitor went on to its normal page).

create table if not exists public.contact_messages (
  id uuid primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text check (char_length(name) <= 100),
  topic text check (char_length(topic) <= 60),
  message text check (char_length(message) <= 1000),
  email text check (char_length(email) <= 200),
  lang text check (char_length(lang) <= 5),
  page text check (char_length(page) <= 80),
  status text not null default 'draft' check (status in ('draft', 'sent', 'unconfirmed')),
  is_read boolean not null default false
);

-- RLS on: visitors have no direct access to this table. Only admins can read, change or delete rows.
alter table public.contact_messages enable row level security;

drop policy if exists "Admins read contact messages" on public.contact_messages;
create policy "Admins read contact messages"
  on public.contact_messages for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins update contact messages" on public.contact_messages;
create policy "Admins update contact messages"
  on public.contact_messages for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins delete contact messages" on public.contact_messages;
create policy "Admins delete contact messages"
  on public.contact_messages for delete
  to authenticated
  using (public.is_admin());

-- Visitors can only call this function. It adds or completes one conversation, found by the random id
-- made in their browser. It cannot read anything, and a sent conversation can no longer be changed.
-- At most 100 new conversations an hour, so a script cannot fill the table.
create or replace function public.save_contact_message(
  p_id uuid,
  p_name text default null,
  p_topic text default null,
  p_message text default null,
  p_email text default null,
  p_lang text default null,
  p_page text default null,
  p_status text default 'draft'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.contact_messages where id = p_id)
     and (select count(*) from public.contact_messages where created_at > now() - interval '1 hour') >= 100 then
    return;
  end if;

  insert into public.contact_messages as saved (id, name, topic, message, email, lang, page, status)
  values (
    p_id,
    left(nullif(trim(p_name), ''), 100),
    left(nullif(trim(p_topic), ''), 60),
    left(nullif(trim(p_message), ''), 1000),
    left(nullif(trim(p_email), ''), 200),
    left(p_lang, 5),
    left(p_page, 80),
    case when p_status in ('draft', 'sent', 'unconfirmed') then p_status else 'draft' end
  )
  on conflict (id) do update set
    name = coalesce(excluded.name, saved.name),
    topic = coalesce(excluded.topic, saved.topic),
    message = coalesce(excluded.message, saved.message),
    email = coalesce(excluded.email, saved.email),
    status = excluded.status,
    updated_at = now()
  where saved.status <> 'sent';
end;
$$;

revoke all on function public.save_contact_message(uuid, text, text, text, text, text, text, text) from public;
grant execute on function public.save_contact_message(uuid, text, text, text, text, text, text, text) to anon, authenticated;

-- Makes the new table and function available to the site straight away.
notify pgrst, 'reload schema';
