-- LIFE RPG FINAL PRODUCT MIGRATION
-- Run once in Supabase SQL Editor on your existing Life RPG project.

create table if not exists public.player_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp_boost_uses integer not null default 0 check (xp_boost_uses >= 0),
  gold_boost_uses integer not null default 0 check (gold_boost_uses >= 0),
  streak_shields integer not null default 0 check (streak_shields >= 0),
  boss_bonus_damage integer not null default 0 check (boss_bonus_damage >= 0 and boss_bonus_damage <= 100),
  boss_week text,
  boss_claimed_week text,
  raid_claim_date date,
  equipped_theme text not null default 'void',
  sound_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.player_state enable row level security;

drop policy if exists "player_state_own_all" on public.player_state;
create policy "player_state_own_all"
on public.player_state
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into public.player_state (user_id)
select id from auth.users
on conflict (user_id) do nothing;
