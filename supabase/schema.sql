create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text default 'Adventurer',
  total_xp integer not null default 0 check (total_xp >= 0),
  gold integer not null default 0 check (gold >= 0),
  streak integer not null default 0 check (streak >= 0),
  intellect integer not null default 1,
  strength integer not null default 1,
  discipline integer not null default 1,
  creativity integer not null default 1,
  last_active_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  description text,
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  attribute text not null default 'intellect' check (attribute in ('intellect','strength','discipline','creativity')),
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  xp_earned integer not null default 0,
  gold_earned integer not null default 0,
  attribute text,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null,
  purchased_at timestamptz not null default now(),
  unique(user_id, item_key)
);

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.activity_log enable row level security;
alter table public.inventory enable row level security;

create policy "profiles_own_select" on public.profiles for select using (auth.uid() = id);
create policy "profiles_own_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_own_update" on public.profiles for update using (auth.uid() = id);

create policy "tasks_own_all" on public.tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "activity_own_all" on public.activity_log for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "inventory_own_all" on public.inventory for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Adventurer'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
