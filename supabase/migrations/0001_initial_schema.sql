-- matteOS initial schema
-- Apply with: supabase db push  (or paste in Supabase SQL Editor)

-- ─── Extensions ──────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ─── updated_at trigger function ─────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ─── Enum types ───────────────────────────────────────────────────────────────

create type public.sex_enum            as enum ('male', 'female');
create type public.activity_level_enum as enum ('sedentary', 'light', 'moderate', 'active', 'very_active');
create type public.task_tag_enum       as enum ('gym', 'finance', 'personal', 'work');
create type public.recurrence_enum     as enum ('none', 'daily', 'mwf', 'weekly', 'monthly');
create type public.finance_category_enum as enum ('food', 'groceries', 'transport', 'housing', 'entertainment', 'health', 'shopping', 'other');
create type public.workout_split_enum  as enum ('chest_triceps', 'back_biceps', 'legs_core');
create type public.book_section_enum   as enum ('quote', 'reflection', 'note');
create type public.meal_status_enum    as enum ('prepped', 'planned', 'flex');

-- ─── Tables ───────────────────────────────────────────────────────────────────

-- user_profile
create table public.user_profile (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text not null,
  height_cm       numeric(5,2),
  birth_date      date,
  sex             public.sex_enum,
  activity_level  public.activity_level_enum not null default 'moderate',
  calorie_goal    integer,
  sleep_goal_hours numeric(3,1) not null default 7.0,
  timezone        text not null default 'UTC',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger user_profile_updated_at
  before update on public.user_profile
  for each row execute function public.set_updated_at();

-- sleep_logs
create table public.sleep_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  log_date    date not null,
  bed_time    timestamptz not null,
  wake_time   timestamptz not null,
  hours       numeric(4,2) not null,
  quality     smallint not null check (quality between 1 and 5),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint sleep_logs_wake_after_bed check (wake_time > bed_time),
  constraint sleep_logs_user_date unique (user_id, log_date)
);

create trigger sleep_logs_updated_at
  before update on public.sleep_logs
  for each row execute function public.set_updated_at();

create index sleep_logs_user_date_idx on public.sleep_logs (user_id, log_date desc);

-- tasks (templates)
create table public.tasks (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  title                   text not null,
  tag                     public.task_tag_enum not null,
  due_time                time,
  duration_minutes        smallint,
  recurrence_type         public.recurrence_enum not null default 'none',
  recurrence_day_of_week  smallint check (recurrence_day_of_week between 0 and 6),
  recurrence_day_of_month smallint check (recurrence_day_of_month between 1 and 28),
  start_date              date not null,
  end_date                date,
  deleted_at              timestamptz,
  sort_order              integer,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint tasks_weekly_needs_dow check (recurrence_type <> 'weekly' or recurrence_day_of_week is not null),
  constraint tasks_monthly_needs_dom check (recurrence_type <> 'monthly' or recurrence_day_of_month is not null)
);

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create index tasks_user_active_idx on public.tasks (user_id, deleted_at) where deleted_at is null;
create index tasks_user_recurrence_idx on public.tasks (user_id, recurrence_type);

-- task_completions
create table public.task_completions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  task_id          uuid not null references public.tasks(id) on delete cascade,
  completion_date  date not null,
  completed_at     timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  constraint task_completions_unique unique (task_id, completion_date)
);

create index task_completions_user_date_idx on public.task_completions (user_id, completion_date);

-- journal_entries
create table public.journal_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  entry_date  date not null,
  body        text not null default '',
  mood_tag    text,
  word_count  integer generated always as (
    case
      when trim(body) = '' then 0
      else array_length(regexp_split_to_array(trim(body), '\s+'), 1)
    end
  ) stored,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint journal_entries_user_date unique (user_id, entry_date)
);

create trigger journal_entries_updated_at
  before update on public.journal_entries
  for each row execute function public.set_updated_at();

create index journal_entries_user_date_idx on public.journal_entries (user_id, entry_date desc);

-- books
create table public.books (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  author        text not null,
  cover_color   text not null,
  cover_texture text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger books_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();

create index books_user_updated_idx on public.books (user_id, updated_at desc);

-- book_sections
create table public.book_sections (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  book_id      uuid not null references public.books(id) on delete cascade,
  section_type public.book_section_enum not null,
  body         text not null,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger book_sections_updated_at
  before update on public.book_sections
  for each row execute function public.set_updated_at();

create index book_sections_book_idx on public.book_sections (book_id, section_type, sort_order);

-- receipt_uploads (must come before transactions)
create table public.receipt_uploads (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  raw_extraction jsonb,
  processed    boolean not null default false,
  created_at   timestamptz not null default now()
);

create index receipt_uploads_user_idx on public.receipt_uploads (user_id, created_at desc);

-- transactions
create table public.transactions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  transaction_date  date not null,
  merchant          text not null,
  amount_cents      integer not null,
  category          public.finance_category_enum not null,
  notes             text,
  receipt_upload_id uuid references public.receipt_uploads(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

create index transactions_user_date_idx on public.transactions (user_id, transaction_date desc);
create index transactions_user_category_idx on public.transactions (user_id, category, transaction_date);

-- workout_sessions
create table public.workout_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  session_date date not null,
  split        public.workout_split_enum not null,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger workout_sessions_updated_at
  before update on public.workout_sessions
  for each row execute function public.set_updated_at();

create index workout_sessions_user_date_idx on public.workout_sessions (user_id, session_date desc);
create index workout_sessions_user_split_idx on public.workout_sessions (user_id, split, session_date desc);

-- workout_exercises
create table public.workout_exercises (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  session_id     uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_name  text not null,
  exercise_order smallint not null,
  sets           smallint not null,
  reps           smallint not null,
  weight_lbs     numeric(6,2) not null,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger workout_exercises_updated_at
  before update on public.workout_exercises
  for each row execute function public.set_updated_at();

create index workout_exercises_session_idx on public.workout_exercises (session_id, exercise_order);
create index workout_exercises_user_name_idx on public.workout_exercises (user_id, exercise_name, created_at desc);

-- weight_logs
create table public.weight_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  log_date    date not null,
  weight_lbs  numeric(6,2) not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint weight_logs_user_date unique (user_id, log_date)
);

create trigger weight_logs_updated_at
  before update on public.weight_logs
  for each row execute function public.set_updated_at();

create index weight_logs_user_date_idx on public.weight_logs (user_id, log_date desc);

-- food_logs (parent — one per day)
create table public.food_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  log_date    date not null,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint food_logs_user_date unique (user_id, log_date)
);

create trigger food_logs_updated_at
  before update on public.food_logs
  for each row execute function public.set_updated_at();

create index food_logs_user_date_idx on public.food_logs (user_id, log_date desc);

-- food_log_meals
create table public.food_log_meals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  food_log_id  uuid not null references public.food_logs(id) on delete cascade,
  meal_order   smallint not null,
  description  text not null,
  calories     integer not null,
  ai_estimated boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger food_log_meals_updated_at
  before update on public.food_log_meals
  for each row execute function public.set_updated_at();

create index food_log_meals_log_idx on public.food_log_meals (food_log_id, meal_order);

-- meal_prep_plans
create table public.meal_prep_plans (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  week_start_date  date not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint meal_prep_plans_user_week unique (user_id, week_start_date),
  constraint meal_prep_plans_monday check (extract(isodow from week_start_date) = 1)
);

create trigger meal_prep_plans_updated_at
  before update on public.meal_prep_plans
  for each row execute function public.set_updated_at();

-- meal_prep_days
create table public.meal_prep_days (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  plan_id     uuid not null references public.meal_prep_plans(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  description text not null,
  calories    integer,
  status      public.meal_status_enum not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint meal_prep_days_plan_day unique (plan_id, day_of_week)
);

create trigger meal_prep_days_updated_at
  before update on public.meal_prep_days
  for each row execute function public.set_updated_at();

-- shopping_items
create table public.shopping_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  plan_id     uuid not null references public.meal_prep_plans(id) on delete cascade,
  item_name   text not null,
  checked     boolean not null default false,
  item_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger shopping_items_updated_at
  before update on public.shopping_items
  for each row execute function public.set_updated_at();

create index shopping_items_plan_idx on public.shopping_items (plan_id, item_order);

-- weekly_reviews
create table public.weekly_reviews (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  week_start_date  date not null,
  ai_narrative     text,
  user_reflection  text,
  stats_snapshot   jsonb not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint weekly_reviews_user_week unique (user_id, week_start_date),
  constraint weekly_reviews_monday check (extract(isodow from week_start_date) = 1)
);

create trigger weekly_reviews_updated_at
  before update on public.weekly_reviews
  for each row execute function public.set_updated_at();

-- agent_rate_limits
create table public.agent_rate_limits (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  day           date not null,
  module        text not null,
  request_count integer not null default 0,
  created_at    timestamptz not null default now(),
  constraint agent_rate_limits_user_day_module unique (user_id, day, module)
);

-- ─── weight_logs_enriched VIEW ────────────────────────────────────────────────

create or replace view public.weight_logs_enriched
  with (security_invoker = true)
  as
  select
    wl.id,
    wl.user_id,
    wl.log_date,
    wl.weight_lbs,
    wl.weight_lbs * 0.45359237                                         as weight_kg,
    up.height_cm / 100.0                                               as height_m,
    case
      when up.height_cm is not null
      then round((wl.weight_lbs * 0.45359237 / ((up.height_cm / 100.0) ^ 2))::numeric, 1)
      else null
    end                                                                as bmi,
    extract(year from age(up.birth_date))::integer                     as age_years,
    case
      when up.height_cm is not null and up.birth_date is not null and up.sex is not null
      then round((
        10 * (wl.weight_lbs * 0.45359237)
        + 6.25 * up.height_cm
        - 5 * extract(year from age(up.birth_date))
        + case when up.sex = 'male' then 5 else -161 end
      )::numeric, 0)
      else null
    end                                                                as bmr,
    case
      when up.height_cm is not null and up.birth_date is not null and up.sex is not null
      then round((
        (10 * (wl.weight_lbs * 0.45359237)
        + 6.25 * up.height_cm
        - 5 * extract(year from age(up.birth_date))
        + case when up.sex = 'male' then 5 else -161 end)
        * case up.activity_level
            when 'sedentary'   then 1.2
            when 'light'       then 1.375
            when 'moderate'    then 1.55
            when 'active'      then 1.725
            when 'very_active' then 1.9
          end
      )::numeric, 0)
      else null
    end                                                                as tdee,
    wl.created_at
  from public.weight_logs wl
  join public.user_profile up on up.id = wl.user_id;

-- ─── Storage bucket ───────────────────────────────────────────────────────────
-- Run this block separately or uncomment if your Supabase project supports it via SQL:

insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false)
  on conflict (id) do nothing;

-- ─── RLS — enable on all tables ──────────────────────────────────────────────

alter table public.user_profile       enable row level security;
alter table public.sleep_logs         enable row level security;
alter table public.tasks              enable row level security;
alter table public.task_completions   enable row level security;
alter table public.journal_entries    enable row level security;
alter table public.books              enable row level security;
alter table public.book_sections      enable row level security;
alter table public.receipt_uploads    enable row level security;
alter table public.transactions       enable row level security;
alter table public.workout_sessions   enable row level security;
alter table public.workout_exercises  enable row level security;
alter table public.weight_logs        enable row level security;
alter table public.food_logs          enable row level security;
alter table public.food_log_meals     enable row level security;
alter table public.meal_prep_plans    enable row level security;
alter table public.meal_prep_days     enable row level security;
alter table public.shopping_items     enable row level security;
alter table public.weekly_reviews     enable row level security;
alter table public.agent_rate_limits  enable row level security;

-- ─── RLS policies ─────────────────────────────────────────────────────────────
-- Standard template: auth.uid() = user_id (or id for user_profile)

-- user_profile (PK = auth user id)
create policy "user_profile_select" on public.user_profile for select using (auth.uid() = id);
create policy "user_profile_insert" on public.user_profile for insert with check (auth.uid() = id);
create policy "user_profile_update" on public.user_profile for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "user_profile_delete" on public.user_profile for delete using (auth.uid() = id);

-- sleep_logs
create policy "sleep_logs_select" on public.sleep_logs for select using (auth.uid() = user_id);
create policy "sleep_logs_insert" on public.sleep_logs for insert with check (auth.uid() = user_id);
create policy "sleep_logs_update" on public.sleep_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sleep_logs_delete" on public.sleep_logs for delete using (auth.uid() = user_id);

-- tasks
create policy "tasks_select" on public.tasks for select using (auth.uid() = user_id);
create policy "tasks_insert" on public.tasks for insert with check (auth.uid() = user_id);
create policy "tasks_update" on public.tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks_delete" on public.tasks for delete using (auth.uid() = user_id);

-- task_completions
create policy "task_completions_select" on public.task_completions for select using (auth.uid() = user_id);
create policy "task_completions_insert" on public.task_completions for insert with check (auth.uid() = user_id);
create policy "task_completions_update" on public.task_completions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "task_completions_delete" on public.task_completions for delete using (auth.uid() = user_id);

-- journal_entries
create policy "journal_entries_select" on public.journal_entries for select using (auth.uid() = user_id);
create policy "journal_entries_insert" on public.journal_entries for insert with check (auth.uid() = user_id);
create policy "journal_entries_update" on public.journal_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "journal_entries_delete" on public.journal_entries for delete using (auth.uid() = user_id);

-- books
create policy "books_select" on public.books for select using (auth.uid() = user_id);
create policy "books_insert" on public.books for insert with check (auth.uid() = user_id);
create policy "books_update" on public.books for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "books_delete" on public.books for delete using (auth.uid() = user_id);

-- book_sections
create policy "book_sections_select" on public.book_sections for select using (auth.uid() = user_id);
create policy "book_sections_insert" on public.book_sections for insert with check (auth.uid() = user_id);
create policy "book_sections_update" on public.book_sections for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "book_sections_delete" on public.book_sections for delete using (auth.uid() = user_id);

-- receipt_uploads
create policy "receipt_uploads_select" on public.receipt_uploads for select using (auth.uid() = user_id);
create policy "receipt_uploads_insert" on public.receipt_uploads for insert with check (auth.uid() = user_id);
create policy "receipt_uploads_update" on public.receipt_uploads for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "receipt_uploads_delete" on public.receipt_uploads for delete using (auth.uid() = user_id);

-- transactions
create policy "transactions_select" on public.transactions for select using (auth.uid() = user_id);
create policy "transactions_insert" on public.transactions for insert with check (auth.uid() = user_id);
create policy "transactions_update" on public.transactions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transactions_delete" on public.transactions for delete using (auth.uid() = user_id);

-- workout_sessions
create policy "workout_sessions_select" on public.workout_sessions for select using (auth.uid() = user_id);
create policy "workout_sessions_insert" on public.workout_sessions for insert with check (auth.uid() = user_id);
create policy "workout_sessions_update" on public.workout_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workout_sessions_delete" on public.workout_sessions for delete using (auth.uid() = user_id);

-- workout_exercises
create policy "workout_exercises_select" on public.workout_exercises for select using (auth.uid() = user_id);
create policy "workout_exercises_insert" on public.workout_exercises for insert with check (auth.uid() = user_id);
create policy "workout_exercises_update" on public.workout_exercises for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workout_exercises_delete" on public.workout_exercises for delete using (auth.uid() = user_id);

-- weight_logs
create policy "weight_logs_select" on public.weight_logs for select using (auth.uid() = user_id);
create policy "weight_logs_insert" on public.weight_logs for insert with check (auth.uid() = user_id);
create policy "weight_logs_update" on public.weight_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "weight_logs_delete" on public.weight_logs for delete using (auth.uid() = user_id);

-- food_logs
create policy "food_logs_select" on public.food_logs for select using (auth.uid() = user_id);
create policy "food_logs_insert" on public.food_logs for insert with check (auth.uid() = user_id);
create policy "food_logs_update" on public.food_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "food_logs_delete" on public.food_logs for delete using (auth.uid() = user_id);

-- food_log_meals
create policy "food_log_meals_select" on public.food_log_meals for select using (auth.uid() = user_id);
create policy "food_log_meals_insert" on public.food_log_meals for insert with check (auth.uid() = user_id);
create policy "food_log_meals_update" on public.food_log_meals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "food_log_meals_delete" on public.food_log_meals for delete using (auth.uid() = user_id);

-- meal_prep_plans
create policy "meal_prep_plans_select" on public.meal_prep_plans for select using (auth.uid() = user_id);
create policy "meal_prep_plans_insert" on public.meal_prep_plans for insert with check (auth.uid() = user_id);
create policy "meal_prep_plans_update" on public.meal_prep_plans for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "meal_prep_plans_delete" on public.meal_prep_plans for delete using (auth.uid() = user_id);

-- meal_prep_days
create policy "meal_prep_days_select" on public.meal_prep_days for select using (auth.uid() = user_id);
create policy "meal_prep_days_insert" on public.meal_prep_days for insert with check (auth.uid() = user_id);
create policy "meal_prep_days_update" on public.meal_prep_days for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "meal_prep_days_delete" on public.meal_prep_days for delete using (auth.uid() = user_id);

-- shopping_items
create policy "shopping_items_select" on public.shopping_items for select using (auth.uid() = user_id);
create policy "shopping_items_insert" on public.shopping_items for insert with check (auth.uid() = user_id);
create policy "shopping_items_update" on public.shopping_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "shopping_items_delete" on public.shopping_items for delete using (auth.uid() = user_id);

-- weekly_reviews
create policy "weekly_reviews_select" on public.weekly_reviews for select using (auth.uid() = user_id);
create policy "weekly_reviews_insert" on public.weekly_reviews for insert with check (auth.uid() = user_id);
create policy "weekly_reviews_update" on public.weekly_reviews for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "weekly_reviews_delete" on public.weekly_reviews for delete using (auth.uid() = user_id);

-- agent_rate_limits (no DELETE — service role handles upsert; users can READ their own usage)
create policy "agent_rate_limits_select" on public.agent_rate_limits for select using (auth.uid() = user_id);
create policy "agent_rate_limits_insert" on public.agent_rate_limits for insert with check (auth.uid() = user_id);
create policy "agent_rate_limits_update" on public.agent_rate_limits for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- No DELETE policy on agent_rate_limits (intentional)

-- ─── Storage: receipts bucket RLS ────────────────────────────────────────────

create policy "receipts_select" on storage.objects for select to authenticated
  using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "receipts_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "receipts_update" on storage.objects for update to authenticated
  using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "receipts_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);
