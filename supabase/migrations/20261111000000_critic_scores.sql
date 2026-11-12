-- Critic score: IGDB's average of professional reviews (0–100) and how many
-- reviews it is based on. Shown next to Supabox's own player rating.
alter table public.games
  add column critic_score smallint check (critic_score between 0 and 100),
  add column critic_count integer not null default 0 check (critic_count >= 0);

-- Paginated "Coming Soon" listing (date order) on top of the existing indexes.
create index games_upcoming_idx on public.games (release_date asc, popularity desc)
  where release_date is not null;
