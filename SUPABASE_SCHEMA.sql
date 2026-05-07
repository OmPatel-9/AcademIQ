create table if not exists public.academiq_sessions (
  id text primary key,
  user_id text not null default 'guest',
  title text not null default 'AcademIQ study session',
  pack jsonb not null,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists academiq_sessions_user_updated_idx
  on public.academiq_sessions (user_id, updated_at desc);

alter table public.academiq_sessions enable row level security;

drop policy if exists "Service role can manage AcademIQ sessions" on public.academiq_sessions;

create policy "Service role can manage AcademIQ sessions"
  on public.academiq_sessions
  for all
  using (true)
  with check (true);
