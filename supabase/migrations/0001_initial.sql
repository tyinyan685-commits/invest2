create extension if not exists pgcrypto;

create type public.report_kind as enum ('decision', 'deep', 'market_scan', 'thesis_challenge');
create type public.report_status as enum ('draft', 'running', 'review', 'published', 'failed');
create type public.evidence_strength as enum ('strong', 'medium', 'weak', 'needs_checking');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  kind public.report_kind not null,
  status public.report_status not null default 'draft',
  symbol text,
  market text not null default 'US',
  title text not null,
  summary text,
  rating text,
  confidence smallint check (confidence between 0 and 100),
  as_of timestamptz not null,
  published_at timestamptz,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  source_type text not null,
  title text not null,
  url text,
  publisher text,
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  strength public.evidence_strength not null,
  metadata jsonb not null default '{}'::jsonb
);

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  claim text not null,
  interpretation text,
  strength public.evidence_strength not null,
  source_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.research_runs (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports(id) on delete set null,
  provider text not null,
  model text not null,
  state text not null default 'queued',
  input_snapshot jsonb not null default '{}'::jsonb,
  usage jsonb not null default '{}'::jsonb,
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index reports_published_idx on public.reports (published_at desc) where status = 'published';
create index reports_symbol_idx on public.reports (symbol, as_of desc);
create index sources_report_idx on public.sources (report_id);
create index claims_report_idx on public.claims (report_id);

alter table public.reports enable row level security;
alter table public.sources enable row level security;
alter table public.claims enable row level security;
alter table public.research_runs enable row level security;

create policy "published reports are public" on public.reports for select using (status = 'published');
create policy "sources of published reports are public" on public.sources for select using (
  exists (select 1 from public.reports where reports.id = sources.report_id and reports.status = 'published')
);
create policy "claims of published reports are public" on public.claims for select using (
  exists (select 1 from public.reports where reports.id = claims.report_id and reports.status = 'published')
);

-- There are deliberately no client-side write policies. Draft creation and
-- research runs use the server-only Supabase secret key after admin auth.
