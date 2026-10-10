-- 愈廣愈準／輕鬆學發音 — Supabase schema
-- 喺 Supabase Dashboard → SQL Editor 貼上執行一次

-- 角色枚舉
create type public.user_role as enum ('言語治療師', '家長', '學生');

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  role public.user_role not null default '學生',
  display_name text,
  link_code text unique default upper(substr(md5(random()::text), 1, 6)),
  created_at timestamptz default now()
);

create table public.links (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid references public.profiles(id) on delete cascade,
  parent_id uuid references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  check (therapist_id is not null or parent_id is not null)
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  unit text,
  word text,
  mode text,
  correct boolean default false,
  score numeric default 0,
  meta jsonb,
  created_at timestamptz default now()
);

create table public.therapist_notes (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  body text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (therapist_id, student_id)
);

-- 註冊後自動建 profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, display_name)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, '學生'),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Supabase (Postgres 15+) 用 execute function
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.links enable row level security;
alter table public.attempts enable row level security;
alter table public.therapist_notes enable row level security;

create policy "profiles read"
  on public.profiles for select using (true); -- 演示用；正式請收窄

create policy "profiles insert own"
  on public.profiles for insert with check (auth.uid() = id);

create policy "profiles update own"
  on public.profiles for update using (auth.uid() = id);

create policy "attempts insert own"
  on public.attempts for insert with check (auth.uid() = student_id);

create policy "attempts read"
  on public.attempts for select using (true); -- 演示用

create policy "links all authenticated"
  on public.links for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "notes therapist"
  on public.therapist_notes for all using (auth.uid() = therapist_id)
  with check (auth.uid() = therapist_id);
