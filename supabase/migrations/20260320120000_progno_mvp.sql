create extension if not exists pgcrypto;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

create table if not exists public.initiatives (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  official_title text not null,
  vote_date date not null,
  type text not null,
  source_url text not null,
  source_locale text not null default 'de',
  summary_en text not null,
  market_closes_at timestamptz not null,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.initiative_import_runs (
  id uuid primary key default gen_random_uuid(),
  source_key text not null,
  source_url text not null,
  source_hash text not null,
  raw_payload text not null,
  preview_payload jsonb not null,
  status text not null default 'previewed' check (status in ('previewed', 'applied', 'failed')),
  applied_initiative_ids uuid[] default '{}'::uuid[],
  triggered_by uuid references auth.users(id) on delete set null,
  error_message text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.metric_versions (
  id uuid primary key default gen_random_uuid(),
  initiative_id uuid not null references public.initiatives(id) on delete cascade,
  index_name text not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'rejected')),
  target_year integer not null default 2036,
  scale text not null default '0-100',
  components jsonb not null,
  ai_model text,
  ai_rationale text,
  source_notes text,
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  approved_at timestamptz
);

create table if not exists public.forecasts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  initiative_id uuid not null references public.initiatives(id) on delete cascade,
  pass_value numeric(5,2) not null check (pass_value >= 0 and pass_value <= 100),
  fail_value numeric(5,2) not null check (fail_value >= 0 and fail_value <= 100),
  points_used integer not null default 1 check (points_used = 1),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, initiative_id)
);

create table if not exists public.forecast_revisions (
  id uuid primary key default gen_random_uuid(),
  forecast_id uuid not null references public.forecasts(id) on delete cascade,
  initiative_id uuid not null references public.initiatives(id) on delete cascade,
  pass_value numeric(5,2) not null check (pass_value >= 0 and pass_value <= 100),
  fail_value numeric(5,2) not null check (fail_value >= 0 and fail_value <= 100),
  points_used integer not null default 1 check (points_used = 1),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists initiatives_vote_date_idx
  on public.initiatives (vote_date asc);

create index if not exists metric_versions_initiative_idx
  on public.metric_versions (initiative_id, created_at desc);

create index if not exists metric_versions_status_idx
  on public.metric_versions (status);

create index if not exists forecast_revisions_initiative_idx
  on public.forecast_revisions (initiative_id, created_at asc);

create index if not exists forecast_revisions_forecast_idx
  on public.forecast_revisions (forecast_id, created_at asc);

drop trigger if exists initiatives_touch_updated_at on public.initiatives;
create trigger initiatives_touch_updated_at
before update on public.initiatives
for each row
execute function public.touch_updated_at();

drop trigger if exists forecasts_touch_updated_at on public.forecasts;
create trigger forecasts_touch_updated_at
before update on public.forecasts
for each row
execute function public.touch_updated_at();

create or replace function public.append_forecast_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.forecast_revisions (
    forecast_id,
    initiative_id,
    pass_value,
    fail_value,
    points_used
  )
  values (
    new.id,
    new.initiative_id,
    new.pass_value,
    new.fail_value,
    new.points_used
  );

  return new;
end;
$$;

drop trigger if exists forecasts_append_revision on public.forecasts;
create trigger forecasts_append_revision
after insert or update of pass_value, fail_value on public.forecasts
for each row
execute function public.append_forecast_revision();

alter table public.user_roles enable row level security;
alter table public.initiatives enable row level security;
alter table public.initiative_import_runs enable row level security;
alter table public.metric_versions enable row level security;
alter table public.forecasts enable row level security;
alter table public.forecast_revisions enable row level security;

drop policy if exists "user_roles_select_self_or_admin" on public.user_roles;
create policy "user_roles_select_self_or_admin"
on public.user_roles
for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "user_roles_admin_manage" on public.user_roles;
create policy "user_roles_admin_manage"
on public.user_roles
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "initiatives_public_read_published" on public.initiatives;
create policy "initiatives_public_read_published"
on public.initiatives
for select
using (status = 'published' or public.is_admin());

drop policy if exists "initiatives_admin_manage" on public.initiatives;
create policy "initiatives_admin_manage"
on public.initiatives
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "import_runs_admin_only" on public.initiative_import_runs;
create policy "import_runs_admin_only"
on public.initiative_import_runs
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "metric_versions_public_read_approved" on public.metric_versions;
create policy "metric_versions_public_read_approved"
on public.metric_versions
for select
using (status = 'approved' or public.is_admin());

drop policy if exists "metric_versions_admin_manage" on public.metric_versions;
create policy "metric_versions_admin_manage"
on public.metric_versions
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "forecasts_select_own" on public.forecasts;
create policy "forecasts_select_own"
on public.forecasts
for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "forecasts_insert_own" on public.forecasts;
create policy "forecasts_insert_own"
on public.forecasts
for insert
with check (auth.uid() = user_id);

drop policy if exists "forecasts_update_own" on public.forecasts;
create policy "forecasts_update_own"
on public.forecasts
for update
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "forecast_revisions_public_read" on public.forecast_revisions;
create policy "forecast_revisions_public_read"
on public.forecast_revisions
for select
using (true);

drop policy if exists "forecast_revisions_admin_manage" on public.forecast_revisions;
create policy "forecast_revisions_admin_manage"
on public.forecast_revisions
for all
using (public.is_admin())
with check (public.is_admin());

insert into public.initiatives (
  slug,
  official_title,
  vote_date,
  type,
  source_url,
  source_locale,
  summary_en,
  market_closes_at,
  status
)
values
  (
    '10-million-switzerland-initiative',
    'Volksinitiative «Keine 10-Millionen-Schweiz! (Nachhaltigkeitsinitiative)»',
    '2026-06-14',
    'Popular Initiative',
    'https://www.news.admin.ch/de/newnsb/WYoX71d58vliwEdJUhJBJ',
    'de',
    'A popular initiative focused on sustainability and migration limits, centered on a proposal to keep Switzerland below 10 million residents before 2050.',
    '2026-06-14T00:00:00+02:00',
    'published'
  ),
  (
    'civilian-service-act-amendment',
    'Änderung vom 26. September 2025 des Bundesgesetzes über den zivilen Ersatzdienst (Zivildienstgesetz, ZDG)',
    '2026-06-14',
    'Optional Referendum',
    'https://www.news.admin.ch/de/newnsb/WYoX71d58vliwEdJUhJBJ',
    'de',
    'An optional referendum on tighter civilian service rules, aimed at reducing military-to-civilian service switches and reshaping the replacement-service framework.',
    '2026-06-14T00:00:00+02:00',
    'published'
  )
on conflict (slug) do update
set
  official_title = excluded.official_title,
  vote_date = excluded.vote_date,
  type = excluded.type,
  source_url = excluded.source_url,
  source_locale = excluded.source_locale,
  summary_en = excluded.summary_en,
  market_closes_at = excluded.market_closes_at,
  status = excluded.status;

insert into public.metric_versions (
  id,
  initiative_id,
  index_name,
  status,
  target_year,
  scale,
  components,
  ai_model,
  ai_rationale,
  source_notes,
  approved_at
)
select
  '91359e85-c812-4a88-b5ae-000000000001'::uuid,
  initiatives.id,
  'Swiss Prosperity Index',
  'approved',
  2036,
  '0-100',
  '[
    {
      "direction": "higher_is_better",
      "label": "Real GDP per capita",
      "rationale": "Captures whether the Swiss economy is generating more inflation-adjusted prosperity per resident by 2036.",
      "source": "FSO national accounts / real GDP per capita",
      "weight": 40
    },
    {
      "direction": "higher_is_better",
      "label": "Housing affordability",
      "rationale": "Measures whether households can still secure housing without an outsized rent or ownership burden.",
      "source": "FSO housing cost burden and affordability indicators",
      "weight": 20
    },
    {
      "direction": "lower_is_better",
      "label": "Average commute time",
      "rationale": "Tests whether population pressure translates into longer daily travel and weaker transport quality.",
      "source": "FSO mobility and commuting indicators",
      "weight": 20
    },
    {
      "direction": "higher_is_better",
      "label": "Biodiversity and green space",
      "rationale": "Preserves the environmental side of the debate by rewarding healthy land use and accessible nature.",
      "source": "FOEN biodiversity and green-space proxy indicators",
      "weight": 10
    },
    {
      "direction": "higher_is_better",
      "label": "Subjective well-being",
      "rationale": "Anchors the index in lived quality of life rather than relying only on hard macroeconomic outputs.",
      "source": "FSO subjective well-being index",
      "weight": 10
    }
  ]'::jsonb,
  'progno-baseline-v1',
  'This baseline metric reflects the core tradeoff in the 10-million debate: Switzerland may gain output from growth, but that gain only counts if housing, mobility, nature, and lived quality of life remain strong enough to preserve broad prosperity by 2036.',
  'Baseline Progno launch metric combining prosperity, housing, congestion, environmental quality, and self-reported well-being.',
  timezone('utc', now())
from public.initiatives
where slug = '10-million-switzerland-initiative'
on conflict (id) do update
set
  initiative_id = excluded.initiative_id,
  index_name = excluded.index_name,
  status = excluded.status,
  target_year = excluded.target_year,
  scale = excluded.scale,
  components = excluded.components,
  ai_model = excluded.ai_model,
  ai_rationale = excluded.ai_rationale,
  source_notes = excluded.source_notes,
  approved_at = excluded.approved_at;

insert into public.metric_versions (
  id,
  initiative_id,
  index_name,
  status,
  target_year,
  scale,
  components,
  ai_model,
  ai_rationale,
  source_notes,
  approved_at
)
select
  '91359e85-c812-4a88-b5ae-000000000002'::uuid,
  initiatives.id,
  'Swiss Civic Resilience Index',
  'approved',
  2036,
  '0-100',
  '[
    {
      "direction": "higher_is_better",
      "label": "Armed forces staffing",
      "rationale": "Tracks whether stricter switching rules actually improve the staffing resilience the reform is meant to protect.",
      "source": "VBS staffing and force-readiness indicators",
      "weight": 30
    },
    {
      "direction": "lower_is_better",
      "label": "Care-sector vacancy pressure",
      "rationale": "Checks whether tighter civilian-service rules shift hidden costs into hospitals, care homes, and social institutions.",
      "source": "FSO health and social-care vacancy indicators",
      "weight": 25
    },
    {
      "direction": "higher_is_better",
      "label": "Emergency readiness",
      "rationale": "Represents the state-capacity argument by rewarding strong response capability across civilian protection systems.",
      "source": "Civil protection and emergency-readiness reporting",
      "weight": 20
    },
    {
      "direction": "higher_is_better",
      "label": "Labor productivity",
      "rationale": "Captures economy-wide efficiency effects rather than evaluating the initiative only through institutional staffing.",
      "source": "SECO and FSO labor productivity indicators",
      "weight": 15
    },
    {
      "direction": "higher_is_better",
      "label": "Subjective well-being",
      "rationale": "Keeps the metric tied to broader household welfare in case institutional gains come with social friction.",
      "source": "FSO subjective well-being index",
      "weight": 10
    }
  ]'::jsonb,
  'progno-baseline-v1',
  'This baseline metric treats the referendum as a state-capacity question with spillovers: the preferred outcome is the one that strengthens defense and emergency readiness by 2036 without simply pushing shortages, productivity losses, or welfare costs into other parts of Swiss society.',
  'Baseline Progno launch metric designed to test whether stricter civilian-service rules improve readiness without degrading welfare elsewhere.',
  timezone('utc', now())
from public.initiatives
where slug = 'civilian-service-act-amendment'
on conflict (id) do update
set
  initiative_id = excluded.initiative_id,
  index_name = excluded.index_name,
  status = excluded.status,
  target_year = excluded.target_year,
  scale = excluded.scale,
  components = excluded.components,
  ai_model = excluded.ai_model,
  ai_rationale = excluded.ai_rationale,
  source_notes = excluded.source_notes,
  approved_at = excluded.approved_at;
