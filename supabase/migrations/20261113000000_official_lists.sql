-- Official Supabox lists: curated by the platform, kept apart from community lists.
-- Built by scripts/build-official-lists.mts from IGDB data (criteria stored with
-- each list); editorial lists stay unpublished until reviewed. Clients can only read.

create table public.official_lists (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title       text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 600),
  category    text not null check (category in ('rankings', 'platforms', 'companies', 'genres', 'special')),
  position    smallint not null default 0,
  -- How the list was built, shown on the page so rankings are never a mystery.
  criteria    text not null default '' check (char_length(criteria) <= 1000),
  published   boolean not null default false,
  updated_at  timestamptz not null default now()
);
create index official_lists_category_idx on public.official_lists (category, position);

create table public.official_list_items (
  list_id  uuid not null references public.official_lists (id) on delete cascade,
  position smallint not null check (position >= 0),
  game_id  uuid not null references public.games (id) on delete cascade,
  -- Optional grouping inside a list ("1990s", "PlayStation 2 era", "2014")…
  section  text check (section is null or char_length(section) <= 60),
  -- …and a short label per entry (e.g. the franchise it represents).
  note     text check (note is null or char_length(note) <= 120),
  primary key (list_id, position)
);
create index official_list_items_game_idx on public.official_list_items (game_id);

alter table public.official_lists enable row level security;
alter table public.official_list_items enable row level security;

create policy "published official lists are readable" on public.official_lists
  for select using (published);
create policy "items of published official lists are readable" on public.official_list_items
  for select using (exists (select 1 from public.official_lists l where l.id = list_id and l.published));
-- No insert/update/delete policies: only the server (service role) writes these.
