create table if not exists public.initiative_news_snapshots (
  id uuid primary key default gen_random_uuid(),
  initiative_id uuid not null references public.initiatives(id) on delete cascade,
  scheduled_for date not null,
  status text not null default 'succeeded' check (status in ('succeeded', 'failed', 'insufficient_signal')),
  sentiment_score numeric(5,2) check (
    sentiment_score is null
    or (sentiment_score >= -100 and sentiment_score <= 100)
  ),
  sentiment_label text check (
    sentiment_label is null
    or sentiment_label in ('negative', 'mixed', 'positive', 'insufficient_signal')
  ),
  confidence_score numeric(4,2) check (
    confidence_score is null
    or (confidence_score >= 0 and confidence_score <= 1)
  ),
  article_count integer not null default 0 check (article_count >= 0),
  summary_en text,
  sources jsonb not null default '[]'::jsonb,
  model text not null,
  prompt_version text not null,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (initiative_id, scheduled_for)
);

create index if not exists initiative_news_snapshots_lookup_idx
  on public.initiative_news_snapshots (initiative_id, scheduled_for desc);

alter table public.initiative_news_snapshots enable row level security;

drop policy if exists "initiative_news_snapshots_public_read" on public.initiative_news_snapshots;
create policy "initiative_news_snapshots_public_read"
on public.initiative_news_snapshots
for select
using (
  status in ('succeeded', 'insufficient_signal')
  or public.is_admin()
);

drop policy if exists "initiative_news_snapshots_admin_manage" on public.initiative_news_snapshots;
create policy "initiative_news_snapshots_admin_manage"
on public.initiative_news_snapshots
for all
using (public.is_admin())
with check (public.is_admin());
