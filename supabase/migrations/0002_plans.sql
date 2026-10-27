-- ============================================================
-- Plans & subscriptions (Base / Rise / Elite for Class 8, 9, 10)
-- Run after 0001_init.sql.
-- ============================================================

-- Allow orders to reference a plan instead of a single course.
alter table orders add column if not exists plan_id text;
alter table orders alter column course_id drop not null;

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  plan_id text not null,            -- 'base' | 'rise' | 'elite'
  plan_name text not null,
  class int not null,               -- 8 | 9 | 10
  amount int not null,              -- total paid in paise (incl GST)
  status text not null default 'active',
  created_at timestamptz not null default now()
);

alter table subscriptions enable row level security;

create policy "subs self read" on subscriptions for select using (auth.uid() = user_id or is_admin());
-- inserts/updates are performed by the service role after verified payment.

create index if not exists idx_subs_user on subscriptions(user_id);
