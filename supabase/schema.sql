-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- It creates the tables, the security rules and the image bucket the site needs.

-- 1. Who is allowed to edit the site
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
-- (no policies: nobody can read or change this table through the public API)

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- 2. All website content, stored as one JSON document (row id = 1)
create table if not exists public.site_content (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.site_content enable row level security;

drop policy if exists "Anyone can read content" on public.site_content;
create policy "Anyone can read content" on public.site_content
  for select using (true);

drop policy if exists "Admins can insert content" on public.site_content;
create policy "Admins can insert content" on public.site_content
  for insert to authenticated with check (public.is_admin());

drop policy if exists "Admins can update content" on public.site_content;
create policy "Admins can update content" on public.site_content
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.site_content (id, data) values (1, '{}'::jsonb) on conflict (id) do nothing;

-- 3. Seat requests and enquiries sent from the website
create table if not exists public.enquiries (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 100),
  phone text not null check (char_length(phone) between 6 and 20),
  plan text default '' check (char_length(plan) <= 60),
  slot text default '' check (char_length(slot) <= 60),
  seat text default '' check (char_length(seat) <= 10),
  message text default '' check (char_length(message) <= 1000),
  status text not null default 'new' check (status in ('new', 'contacted', 'joined', 'closed')),
  created_at timestamptz not null default now()
);
alter table public.enquiries enable row level security;

drop policy if exists "Anyone can send an enquiry" on public.enquiries;
create policy "Anyone can send an enquiry" on public.enquiries
  for insert to anon, authenticated with check (status = 'new');

drop policy if exists "Admins can read enquiries" on public.enquiries;
create policy "Admins can read enquiries" on public.enquiries
  for select to authenticated using (public.is_admin());

drop policy if exists "Admins can update enquiries" on public.enquiries;
create policy "Admins can update enquiries" on public.enquiries
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can delete enquiries" on public.enquiries;
create policy "Admins can delete enquiries" on public.enquiries
  for delete to authenticated using (public.is_admin());

-- 4. Public image bucket for logo, hero, gallery and testimonial photos
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "Anyone can view media" on storage.objects;
create policy "Anyone can view media" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "Admins can upload media" on storage.objects;
create policy "Admins can upload media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "Admins can change media" on storage.objects;
create policy "Admins can change media" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin());

drop policy if exists "Admins can delete media" on storage.objects;
create policy "Admins can delete media" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());

-- 5. Make yourself an admin.
-- First create your login in Dashboard -> Authentication -> Users -> Add user
-- (tick "Auto confirm user"), then run this line with your email:
--
-- insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';
