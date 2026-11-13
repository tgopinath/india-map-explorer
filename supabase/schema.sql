-- India Map Explorer — optional Supabase backend.
-- Reference tables (states, districts) are seeded from the app's data files by
-- `npm run seed:sql`; progress rows are written by the app when cloud backup is on.
-- No table stores names, emails or any other personal information about children.

create table if not exists states (
  id              text primary key,             -- e.g. 'tamil-nadu'
  lgd_code        integer not null unique,      -- Local Government Directory code
  name            text not null,
  type            text not null check (type in ('state', 'ut')),
  capital         text not null,
  region          text not null,
  languages       text[] not null,
  district_count  integer not null,
  neighbours      text[] not null,
  data_status     text not null check (data_status in ('verified', 'snapshot', 'issues')),
  boundary_url    text not null                 -- TopoJSON served by the app
);

create table if not exists districts (
  id              text not null,                -- slug, unique within a state
  state_id        text not null references states(id) on delete cascade,
  lgd_code        integer,                      -- 0 for areas without an LGD code
  name            text not null,                -- display name (state government spelling when curated)
  lgd_name        text not null,                -- name as written in LGD data
  headquarters    text,
  fact            text,
  curated         boolean not null default false,
  neighbours      text[] not null,
  boundary_url    text not null,
  primary key (state_id, id)
);

create table if not exists quiz_results (
  id          bigint generated always as identity primary key,
  device_id   uuid not null,
  level       text not null check (level in ('beginner', 'intermediate', 'advanced')),
  state_id    text references states(id),
  correct     integer not null,
  total       integer not null,
  score       integer not null,
  time_sec    integer not null,
  stars       integer not null,
  created_at  timestamptz not null default now()
);

-- One row per device: the whole progress object, as kept in the browser.
create table if not exists progress (
  device_id   uuid primary key,
  data        jsonb not null,
  points      integer not null default 0,
  updated_at  timestamptz not null default now()
);

alter table states enable row level security;
alter table districts enable row level security;
alter table quiz_results enable row level security;
alter table progress enable row level security;

create policy "reference data is public" on states for select using (true);
create policy "reference data is public" on districts for select using (true);

-- Devices can write their own anonymous progress. Tighten this (e.g. Supabase anonymous
-- auth with auth.uid() = device_id) before using it beyond a pilot.
create policy "devices upsert progress" on progress for insert with check (true);
create policy "devices update progress" on progress for update using (true);
create policy "devices add quiz results" on quiz_results for insert with check (true);
