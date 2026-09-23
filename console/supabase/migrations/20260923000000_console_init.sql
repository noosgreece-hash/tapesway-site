-- tapesway console: initial schema.
-- Run in the Supabase SQL editor or with `supabase db push`.
--
-- Access model
--   * The console server talks to the database with the service role key (server-side only).
--   * Row-level security is on for every table. The only policy lets a signed-in user whose
--     email is in public.console_owners read and write. The anon key can read nothing.
--   * Add the owner after running this file:
--       insert into public.console_owners (email) values ('owner@example.com');
--     and create the same user under Authentication > Users (email + password).

create extension if not exists pgcrypto;

-- ---------- owners ----------
create table if not exists public.console_owners (
  email text primary key check (email = lower(email))
);

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.console_owners o
    where o.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------- leads (website form inbox) ----------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business text not null default '',
  email text not null,
  island text not null default '',
  business_type text not null default '',
  message text not null,
  source text not null default 'website',
  status text not null default 'new' check (status in ('new', 'contacted', 'proposal', 'won', 'lost')),
  client_id uuid,
  sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists leads_status_idx on public.leads (status, created_at desc);

-- ---------- clients ----------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_name text not null default '',
  email text not null default '',
  phone text not null default '',
  island text not null default '',
  business_type text not null default '',
  languages text[] not null default '{EN}' check (languages <@ array['EN', 'DE', 'FR', 'EL']),
  tone_of_voice text not null default '',
  audience text not null default '',
  dos text not null default '',
  donts text not null default '',
  links text[] not null default '{}',
  plan text not null default '',
  status text not null default 'active' check (status in ('active', 'paused')),
  notes text not null default '',
  created_from_lead uuid references public.leads (id) on delete set null,
  sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads
  drop constraint if exists leads_client_id_fkey,
  add constraint leads_client_id_fkey foreign key (client_id) references public.clients (id) on delete set null;

-- ---------- generation jobs ----------
create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  week text not null check (week ~ '^\d{4}-W\d{2}$'),
  kind text not null default 'week' check (kind in ('week', 'item')),
  item_id uuid,
  notes text,
  regenerate boolean not null default false,
  batch_id uuid,
  status text not null default 'queued' check (status in ('queued', 'generating', 'ready', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);
create index if not exists generation_jobs_status_idx on public.generation_jobs (status, created_at);
create index if not exists generation_jobs_batch_idx on public.generation_jobs (batch_id);
-- No duplicate work: one active week job per client+week, one active redo per item.
create unique index if not exists generation_jobs_one_active_week
  on public.generation_jobs (client_id, week) where kind = 'week' and status in ('queued', 'generating');
create unique index if not exists generation_jobs_one_active_item
  on public.generation_jobs (item_id) where kind = 'item' and status in ('queued', 'generating');

-- ---------- content items ----------
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  week text not null check (week ~ '^\d{4}-W\d{2}$'),
  job_id uuid references public.generation_jobs (id) on delete set null,
  kind text not null default 'video' check (kind in ('video')),
  slot int not null default 1,
  title text not null default '',
  script text not null default '',
  captions jsonb not null default '{}'::jsonb, -- { "EN": "...", "EL": "..." }
  hashtags text[] not null default '{}',
  media_url text, -- https URL, or a path in the "videos" storage bucket
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'changes_requested')),
  review_notes text,
  ai_verdict text check (ai_verdict in ('green', 'yellow', 'red')), -- phase 2: AI reviewer
  ai_notes text,
  version int not null default 1,
  sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz
);
create index if not exists content_items_client_week_idx on public.content_items (client_id, week);
create index if not exists content_items_review_idx on public.content_items (review_status);

alter table public.generation_jobs
  drop constraint if exists generation_jobs_item_id_fkey,
  add constraint generation_jobs_item_id_fkey foreign key (item_id) references public.content_items (id) on delete cascade;

-- ---------- deliveries ----------
create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  week text not null check (week ~ '^\d{4}-W\d{2}$'),
  token text not null unique check (length(token) >= 32),
  sent_at timestamptz,
  sent_to text,
  opened_at timestamptz,
  last_opened_at timestamptz,
  open_count int not null default 0,
  downloads jsonb not null default '[]'::jsonb, -- [{ "item_id": "...", "at": "..." }]
  sample boolean not null default false,
  created_at timestamptz not null default now(),
  unique (client_id, week)
);

-- ---------- email outbox (copy of every email the console sends) and activity ----------
create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  from_email text not null,
  subject text not null,
  text_body text not null default '',
  html_body text not null default '',
  kind text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.activity (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  message text not null,
  client_id uuid references public.clients (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists activity_created_idx on public.activity (created_at desc);

-- ---------- updated_at ----------
drop trigger if exists leads_touch on public.leads;
create trigger leads_touch before update on public.leads for each row execute function public.touch_updated_at();
drop trigger if exists clients_touch on public.clients;
create trigger clients_touch before update on public.clients for each row execute function public.touch_updated_at();
drop trigger if exists content_items_touch on public.content_items;
create trigger content_items_touch before update on public.content_items for each row execute function public.touch_updated_at();

-- ---------- row-level security: only the signed-in owner ----------
do $$
declare t text;
begin
  foreach t in array array['console_owners', 'leads', 'clients', 'generation_jobs', 'content_items', 'deliveries', 'email_outbox', 'activity']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists owner_all on public.%I', t);
    execute format('create policy owner_all on public.%I for all to authenticated using (public.is_owner()) with check (public.is_owner())', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

-- ---------- job queue functions (called by the console server with the service role) ----------

-- Queues one week job per request; skips clients that already have drafts for the week
-- (unless regenerate) or that have a job in progress. Returns { created: [...], skipped: [...] }.
create or replace function public.enqueue_week_jobs(p_requests jsonb, p_batch uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r jsonb;
  v_client uuid;
  v_week text;
  v_regen boolean;
  v_job public.generation_jobs;
  created jsonb := '[]'::jsonb;
  skipped jsonb := '[]'::jsonb;
begin
  for r in select * from jsonb_array_elements(p_requests) loop
    v_client := (r ->> 'client_id')::uuid;
    v_week := r ->> 'week';
    v_regen := coalesce((r ->> 'regenerate')::boolean, false);
    perform pg_advisory_xact_lock(hashtext(v_client::text || v_week));
    if not exists (select 1 from clients where id = v_client) then
      skipped := skipped || jsonb_build_object('client_id', v_client, 'reason', 'missing');
    elsif exists (select 1 from generation_jobs where client_id = v_client and week = v_week and status in ('queued', 'generating')) then
      skipped := skipped || jsonb_build_object('client_id', v_client, 'reason', 'in_progress');
    elsif not v_regen and exists (select 1 from content_items where client_id = v_client and week = v_week) then
      skipped := skipped || jsonb_build_object('client_id', v_client, 'reason', 'already_generated');
    else
      insert into generation_jobs (client_id, week, kind, regenerate, batch_id)
      values (v_client, v_week, 'week', v_regen, p_batch)
      returning * into v_job;
      created := created || to_jsonb(v_job);
    end if;
  end loop;
  return jsonb_build_object('created', created, 'skipped', skipped);
end;
$$;

-- Queues a redo of one item with the owner's notes. Returns the job, or null if the
-- week is being generated or this item is already queued.
create or replace function public.enqueue_item_job(p_item uuid, p_notes text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_item public.content_items;
  v_job public.generation_jobs;
begin
  select * into v_item from content_items where id = p_item;
  if not found then return null; end if;
  perform pg_advisory_xact_lock(hashtext(v_item.client_id::text || v_item.week));
  if exists (select 1 from generation_jobs where client_id = v_item.client_id and week = v_item.week
             and status in ('queued', 'generating') and (kind = 'week' or item_id = p_item)) then
    return null;
  end if;
  insert into generation_jobs (client_id, week, kind, item_id, notes, regenerate)
  values (v_item.client_id, v_item.week, 'item', p_item, p_notes, true)
  returning * into v_job;
  return to_jsonb(v_job);
end;
$$;

-- Claims the oldest queued job (or one stuck in "generating" for 10 minutes).
create or replace function public.claim_next_job() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_job public.generation_jobs;
begin
  update generation_jobs set status = 'generating', started_at = now()
  where id = (
    select id from generation_jobs
    where status = 'queued' or (status = 'generating' and started_at < now() - interval '10 minutes')
    order by created_at
    limit 1
    for update skip locked
  )
  returning * into v_job;
  if not found then return null; end if;
  return to_jsonb(v_job);
end;
$$;

create or replace function public.delivery_record_open(p_id uuid) returns void
language sql security definer set search_path = public as $$
  update deliveries
  set opened_at = coalesce(opened_at, now()), last_opened_at = now(), open_count = open_count + 1
  where id = p_id;
$$;

create or replace function public.delivery_record_download(p_id uuid, p_item uuid) returns void
language sql security definer set search_path = public as $$
  update deliveries
  set downloads = downloads || jsonb_build_array(jsonb_build_object('item_id', p_item, 'at', now()))
  where id = p_id;
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'enqueue_week_jobs(jsonb, uuid)', 'enqueue_item_job(uuid, text)', 'claim_next_job()',
    'delivery_record_open(uuid)', 'delivery_record_download(uuid, uuid)'
  ]
  loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;

-- ---------- storage: finished videos ----------
-- Private bucket. The generator uploads to videos/<client_id>/<week>/<file>.mp4 and stores
-- that path in content_items.media_url; delivery pages hand out short-lived signed URLs.
insert into storage.buckets (id, name, public)
values ('videos', 'videos', false)
on conflict (id) do nothing;

drop policy if exists videos_owner_all on storage.objects;
create policy videos_owner_all on storage.objects for all to authenticated
  using (bucket_id = 'videos' and public.is_owner())
  with check (bucket_id = 'videos' and public.is_owner());
