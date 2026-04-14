create table if not exists public.ai_model_forecasts (
  id uuid primary key default gen_random_uuid(),
  initiative_id uuid not null references public.initiatives(id) on delete cascade,
  provider text not null,
  model text not null,
  prompt_version text not null,
  rationale text not null,
  pass_value numeric(5,2) not null check (pass_value >= 0 and pass_value <= 100),
  fail_value numeric(5,2) not null check (fail_value >= 0 and fail_value <= 100),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (initiative_id, provider)
);

create table if not exists public.ai_model_forecast_revisions (
  id uuid primary key default gen_random_uuid(),
  ai_model_forecast_id uuid not null references public.ai_model_forecasts(id) on delete cascade,
  initiative_id uuid not null references public.initiatives(id) on delete cascade,
  provider text not null,
  model text not null,
  prompt_version text not null,
  rationale text not null,
  pass_value numeric(5,2) not null check (pass_value >= 0 and pass_value <= 100),
  fail_value numeric(5,2) not null check (fail_value >= 0 and fail_value <= 100),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists ai_model_forecasts_initiative_idx
  on public.ai_model_forecasts (initiative_id, updated_at desc);

create index if not exists ai_model_forecast_revisions_initiative_idx
  on public.ai_model_forecast_revisions (initiative_id, created_at asc);

create index if not exists ai_model_forecast_revisions_forecast_idx
  on public.ai_model_forecast_revisions (ai_model_forecast_id, created_at asc);

drop trigger if exists ai_model_forecasts_touch_updated_at on public.ai_model_forecasts;
create trigger ai_model_forecasts_touch_updated_at
before update on public.ai_model_forecasts
for each row
execute function public.touch_updated_at();

create or replace function public.append_ai_model_forecast_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ai_model_forecast_revisions (
    ai_model_forecast_id,
    initiative_id,
    provider,
    model,
    prompt_version,
    rationale,
    pass_value,
    fail_value
  )
  values (
    new.id,
    new.initiative_id,
    new.provider,
    new.model,
    new.prompt_version,
    new.rationale,
    new.pass_value,
    new.fail_value
  );

  return new;
end;
$$;

drop trigger if exists ai_model_forecasts_append_revision on public.ai_model_forecasts;
create trigger ai_model_forecasts_append_revision
after insert or update of model, prompt_version, rationale, pass_value, fail_value
on public.ai_model_forecasts
for each row
execute function public.append_ai_model_forecast_revision();

alter table public.ai_model_forecasts enable row level security;
alter table public.ai_model_forecast_revisions enable row level security;

drop policy if exists "ai_model_forecasts_public_read" on public.ai_model_forecasts;
create policy "ai_model_forecasts_public_read"
on public.ai_model_forecasts
for select
using (true);

drop policy if exists "ai_model_forecasts_admin_manage" on public.ai_model_forecasts;
create policy "ai_model_forecasts_admin_manage"
on public.ai_model_forecasts
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "ai_model_forecast_revisions_public_read" on public.ai_model_forecast_revisions;
create policy "ai_model_forecast_revisions_public_read"
on public.ai_model_forecast_revisions
for select
using (true);

drop policy if exists "ai_model_forecast_revisions_admin_manage" on public.ai_model_forecast_revisions;
create policy "ai_model_forecast_revisions_admin_manage"
on public.ai_model_forecast_revisions
for all
using (public.is_admin())
with check (public.is_admin());
