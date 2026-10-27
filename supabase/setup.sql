-- Suhana Education — full database setup (run once in Supabase SQL Editor)
-- Creates all tables, security policies, and seed data.

-- ========== 1. SCHEMA ==========
-- ============================================================
-- Suhana Education — initial schema (Supabase / PostgreSQL)
-- Run in Supabase SQL editor, or via `supabase db push`.
-- Covers profiles/roles, course hierarchy, enrollments,
-- progress, live classes, tests/questions, attempts, orders,
-- notifications and audit logs, with row-level security.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- enums ----------
do $$ begin
  create type user_role as enum ('student','teacher','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type course_type as enum ('Live','Recorded','Test Series');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lecture_type as enum ('recorded','live');
exception when duplicate_object then null; end $$;

do $$ begin
  create type question_type as enum ('single','multi','numeric');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('created','paid','failed','refunded');
exception when duplicate_object then null; end $$;

-- ---------- profiles (1:1 with auth.users) ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role user_role not null default 'student',
  class int,                       -- 9..12
  target_exam text,                -- board, e.g. JKBOSE (J&K State Board)
  phone text,
  avatar_url text,
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- course hierarchy ----------
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  class int not null,
  exam text not null,              -- board/stream, e.g. JKBOSE
  subject text not null,           -- Physics / Chemistry / Mathematics / Biology
  type course_type not null default 'Recorded',
  teacher_name text not null default 'TBA',
  teacher_id uuid references profiles(id) on delete set null,
  price int not null default 0,    -- in INR (0 = free)
  mrp int not null default 0,
  description text,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists chapters (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  position int not null default 0
);

create table if not exists lectures (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references chapters(id) on delete cascade,
  title text not null,
  type lecture_type not null default 'recorded',
  duration_min int not null default 45,
  description text,
  video_url text,                  -- recorded source (private storage / CDN)
  scheduled_at timestamptz,        -- for live lectures
  position int not null default 0
);

-- ---------- enrollments + progress ----------
create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table if not exists lecture_progress (
  user_id uuid not null references profiles(id) on delete cascade,
  lecture_id uuid not null references lectures(id) on delete cascade,
  completed boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, lecture_id)
);

-- ---------- tests ----------
create table if not exists tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  exam text not null,
  class int not null,
  duration_min int not null default 30,
  marks_correct int not null default 4,
  marks_wrong int not null default -1,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references tests(id) on delete cascade,
  subject text not null,
  type question_type not null default 'single',
  text text not null,
  options jsonb,                   -- array of strings (null for numeric)
  answer jsonb not null,           -- int | int[] | number
  marks int not null default 4,
  position int not null default 0
);

create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  test_id uuid not null references tests(id) on delete cascade,
  answers jsonb not null default '{}',
  score int not null default 0,
  max_score int not null default 0,
  correct int not null default 0,
  wrong int not null default 0,
  unattempted int not null default 0,
  by_subject jsonb not null default '{}',
  time_used_sec int not null default 0,
  submitted_at timestamptz not null default now()
);

-- ---------- payments ----------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  amount int not null,             -- in paise
  currency text not null default 'INR',
  razorpay_order_id text unique,
  razorpay_payment_id text,
  status order_status not null default 'created',
  created_at timestamptz not null default now()
);

-- ---------- notifications ----------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- audit log ----------
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor uuid references profiles(id) on delete set null,
  action text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Auto-create a profile row when a new auth user signs up
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), new.phone)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- helper: is current user an admin?
create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('admin','teacher'));
$$;

-- ============================================================
-- Row level security
-- ============================================================
alter table profiles enable row level security;
alter table courses enable row level security;
alter table chapters enable row level security;
alter table lectures enable row level security;
alter table enrollments enable row level security;
alter table lecture_progress enable row level security;
alter table tests enable row level security;
alter table questions enable row level security;
alter table attempts enable row level security;
alter table orders enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;

-- profiles: a user sees/edits their own; admins see all
create policy "profiles self read" on profiles for select using (auth.uid() = id or is_admin());
create policy "profiles self update" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles self insert" on profiles for insert with check (auth.uid() = id);

-- public catalog: anyone can read published courses/chapters/lectures/tests
create policy "courses public read" on courses for select using (published or is_staff());
create policy "chapters public read" on chapters for select using (true);
create policy "lectures public read" on lectures for select using (true);
create policy "tests public read" on tests for select using (published or is_staff());

-- questions: answers must NOT leak. Only staff can read directly.
-- Students receive sanitized questions through a server route (service role strips answers).
create policy "questions staff read" on questions for select using (is_staff());

-- staff can write catalog + tests + questions
create policy "courses staff write" on courses for all using (is_staff()) with check (is_staff());
create policy "chapters staff write" on chapters for all using (is_staff()) with check (is_staff());
create policy "lectures staff write" on lectures for all using (is_staff()) with check (is_staff());
create policy "tests staff write" on tests for all using (is_staff()) with check (is_staff());
create policy "questions staff write" on questions for all using (is_staff()) with check (is_staff());

-- enrollments: user manages own; staff/admin read all
create policy "enroll self read" on enrollments for select using (auth.uid() = user_id or is_staff());
create policy "enroll self insert" on enrollments for insert with check (auth.uid() = user_id);
create policy "enroll admin manage" on enrollments for delete using (is_admin() or auth.uid() = user_id);

-- progress: user owns
create policy "progress self" on lecture_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- attempts: user owns; staff read all
create policy "attempts self read" on attempts for select using (auth.uid() = user_id or is_staff());
create policy "attempts self insert" on attempts for insert with check (auth.uid() = user_id);

-- orders: user reads own; inserts/updates handled by service role on the server
create policy "orders self read" on orders for select using (auth.uid() = user_id or is_admin());

-- notifications: user owns
create policy "notif self read" on notifications for select using (auth.uid() = user_id);
create policy "notif self update" on notifications for update using (auth.uid() = user_id);

-- audit: admins only
create policy "audit admin read" on audit_logs for select using (is_admin());

-- indexes
create index if not exists idx_chapters_course on chapters(course_id);
create index if not exists idx_lectures_chapter on lectures(chapter_id);
create index if not exists idx_enroll_user on enrollments(user_id);
create index if not exists idx_progress_user on lecture_progress(user_id);
create index if not exists idx_questions_test on questions(test_id);
create index if not exists idx_attempts_user on attempts(user_id);
create index if not exists idx_orders_user on orders(user_id);
create index if not exists idx_notif_user on notifications(user_id);

-- ========== 2. PLANS ==========
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

-- ========== 3. SEED DATA ==========
-- ============================================================
-- Seed data for Suhana Education (run after 0001_init.sql & 0002_plans.sql).
-- J&K State Board (JKBOSE), Classes 8–10. Safe to re-run (ON CONFLICT).
-- ============================================================

insert into courses (id, title, class, exam, subject, type, teacher_name, price, mrp, description) values
 ('11111111-0000-0000-0000-000000000001','Mathematics — Class 8 (JKBOSE)',8,'JKBOSE','Mathematics','Recorded','Mr. D. Rao',0,0,'Complete JKBOSE Class 8 Mathematics with recorded lessons and practice worksheets.'),
 ('11111111-0000-0000-0000-000000000002','Science — Class 8 (JKBOSE)',8,'JKBOSE','Science','Live','Ms. P. Verma',1999,3000,'JKBOSE Class 8 Science with live classes, diagrams and chapter tests.'),
 ('11111111-0000-0000-0000-000000000003','Mathematics — Class 9 (JKBOSE)',9,'JKBOSE','Mathematics','Live','Prof. K. Iyer',2499,4000,'JKBOSE Class 9 Mathematics — live classes, DPPs and fortnightly exams.'),
 ('11111111-0000-0000-0000-000000000004','Science — Class 9 (JKBOSE)',9,'JKBOSE','Science','Recorded','Dr. R. Sharma',2499,4000,'JKBOSE Class 9 Science — Physics, Chemistry and Biology topics with tests.'),
 ('11111111-0000-0000-0000-000000000005','Mathematics — Class 10 (JKBOSE)',10,'JKBOSE','Mathematics','Live','Prof. K. Iyer',2899,5000,'JKBOSE Class 10 Mathematics — complete board preparation with live classes and mock tests.'),
 ('11111111-0000-0000-0000-000000000006','Science — Class 10 (JKBOSE)',10,'JKBOSE','Science','Live','Dr. S. Gupta',2899,5000,'JKBOSE Class 10 Science — full board syllabus with live classes, DPPs and tests.'),
 ('11111111-0000-0000-0000-000000000007','English — Class 10 (JKBOSE)',10,'JKBOSE','English','Recorded','Ms. S. Qureshi',1499,2500,'JKBOSE Class 10 English — prose, poetry, grammar and writing skills.')
on conflict (id) do nothing;

insert into chapters (id, course_id, title, position) values
 ('22222222-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000005','Real Numbers',0),
 ('22222222-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000005','Quadratic Equations',1),
 ('22222222-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000006','Light — Reflection & Refraction',0),
 ('22222222-0000-0000-0000-000000000004','11111111-0000-0000-0000-000000000004','Matter in Our Surroundings',0)
on conflict (id) do nothing;

insert into lectures (chapter_id, title, type, duration_min, description, position) values
 ('22222222-0000-0000-0000-000000000001','Euclid''s division lemma','recorded',44,'HCF and the division algorithm.',0),
 ('22222222-0000-0000-0000-000000000001','Fundamental theorem of arithmetic','recorded',46,'Prime factorisation, HCF & LCM.',1),
 ('22222222-0000-0000-0000-000000000002','Solving quadratic equations','recorded',55,'Factorisation and quadratic formula.',0),
 ('22222222-0000-0000-0000-000000000003','Spherical mirrors & ray diagrams','recorded',48,'Mirror formula and magnification.',0),
 ('22222222-0000-0000-0000-000000000004','States of matter','recorded',47,'Solids, liquids, gases and changes.',0)
on conflict do nothing;

insert into lectures (chapter_id, title, type, duration_min, description, scheduled_at, position) values
 ('22222222-0000-0000-0000-000000000002','Live: board-pattern problems','live',60,'Live exam-oriented practice.', now() + interval '4 days', 1)
on conflict do nothing;

insert into tests (id, title, exam, class, duration_min, marks_correct, marks_wrong) values
 ('33333333-0000-0000-0000-000000000001','Class 10 Mathematics — Practice Test (JKBOSE)','JKBOSE',10,25,4,-1),
 ('33333333-0000-0000-0000-000000000002','Class 9 Science — Chapter Test (JKBOSE)','JKBOSE',9,20,4,-1)
on conflict (id) do nothing;

insert into questions (test_id, subject, type, text, options, answer, marks, position) values
 ('33333333-0000-0000-0000-000000000001','Mathematics','single','The HCF of 96 and 404 is:','["2","4","8","12"]','1',4,0),
 ('33333333-0000-0000-0000-000000000001','Mathematics','numeric','If the roots of x^2 - 5x + 6 = 0 are a and b, enter a + b.',null,'5',4,1),
 ('33333333-0000-0000-0000-000000000001','Mathematics','single','The distance of the point (3, 4) from the origin is:','["5","7","1","25"]','0',4,2),
 ('33333333-0000-0000-0000-000000000002','Science','single','The basic structural and functional unit of life is the:','["Tissue","Organ","Cell","Organism"]','2',4,0),
 ('33333333-0000-0000-0000-000000000002','Science','multi','Which are states of matter? (Select all)','["Solid","Energy","Liquid","Gas"]','[0,2,3]',4,1)
on conflict do nothing;
