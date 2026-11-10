-- Phase 3: real game catalog from IGDB.
-- Adds image and popularity columns, search indexes, and removes the fictional
-- prototype games. Games are written only by the server (secret key) — there
-- are still no client write policies on public.games.

create extension if not exists pg_trgm with schema extensions;

alter table public.games
  add column logo_url text,
  add column background_url text,
  add column popularity integer not null default 0;

-- IGDB slugs can contain double dashes (e.g. "andy-capp--1").
alter table public.games drop constraint games_slug_check;
alter table public.games add constraint games_slug_check check (slug ~ '^[a-z0-9]+(-+[a-z0-9]+)*$');

-- Fast title search (substring, case-insensitive) and the main listing queries.
create index games_title_trgm_idx on public.games using gin (lower(title) extensions.gin_trgm_ops);
create index games_popularity_idx on public.games (popularity desc);
create index games_released_recent_idx on public.games (release_date desc, popularity desc)
  where release_date is not null;

-- Remove the fictional prototype catalog (and anything that referenced it).
delete from public.games where provider = 'mock';
