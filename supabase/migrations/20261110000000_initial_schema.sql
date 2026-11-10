-- Supabox — initial schema
-- Identity is Supabase Auth: profiles.id = auth.users.id.
-- Authorization is enforced here with Row Level Security (RLS); the web app
-- only ever uses the public (publishable/anon) key.

create extension if not exists citext with schema extensions;

-- ───────────────────────── Enums ─────────────────────────
create type public.library_status as enum ('want_to_play', 'playing', 'completed', 'dropped');
create type public.play_session_kind as enum ('first_playthrough', 'replay', 'returned');
create type public.list_visibility as enum ('public', 'private');
create type public.activity_type as enum ('added_to_library', 'started_playing', 'completed', 'published_review');

-- ───────────────────────── Helpers ─────────────────────────
create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ───────────────────────── Profiles ─────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     extensions.citext not null unique check (username ~ '^[a-z0-9_]{3,30}$'),
  display_name text not null check (char_length(display_name) between 1 and 50),
  bio          text not null default '' check (char_length(bio) <= 300),
  avatar_hue   smallint not null default floor(random() * 360)::smallint check (avatar_hue between 0 and 359),
  avatar_path  text,                                  -- Supabase Storage path (future uploads)
  is_private   boolean not null default false,        -- future account privacy
  locale       text not null default 'en' check (locale in ('en', 'pt-BR')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Create the profile automatically when someone signs up.
-- username / display_name come from the sign-up form (auth user metadata).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_username text := lower(coalesce(new.raw_user_meta_data ->> 'username', ''));
  v_display  text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '');
begin
  if v_username !~ '^[a-z0-9_]{3,30}$' then
    -- Fallback for sign-ups without a valid username (e.g. created from the dashboard).
    v_username := 'player_' || substr(replace(new.id::text, '-', ''), 1, 10);
  end if;
  insert into public.profiles (id, username, display_name)
  values (new.id, v_username, left(coalesce(v_display, v_username), 50));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lets the sign-up form check a username before submitting.
create function public.is_username_available(p_username text) returns boolean
language sql stable security definer set search_path = '' as $$
  select not exists (select 1 from public.profiles where lower(username::text) = lower(trim(p_username)));
$$;

-- ───────────────────────── Games (catalog cache) ─────────────────────────
-- Our own stable id; provider ids are stored separately so the catalog source can
-- change without touching user data. Written by the server only (no write policies).
create table public.games (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title              text not null,
  release_date       date,                            -- null = TBA (upcoming)
  summary            text not null default '',
  description        text not null default '',
  developer          text,
  publisher          text,
  platforms          text[] not null default '{}',
  genres             text[] not null default '{}',
  cover_url          text,
  provider           text not null,
  provider_id        text not null,
  provider_synced_at timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (provider, provider_id)
);
create index games_release_date_idx on public.games (release_date desc nulls last);
create index games_title_fts_idx on public.games using gin (to_tsvector('simple', title));
create trigger games_touch before update on public.games
  for each row execute function public.touch_updated_at();

-- ───────────────────────── Library (also the wishlist) ─────────────────────────
-- The wishlist is status = 'want_to_play'. One row per user/game prevents duplicates.
create table public.user_games (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  game_id    uuid not null references public.games (id) on delete cascade,
  status     public.library_status not null,
  added_at   timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id)
);
create index user_games_user_status_idx on public.user_games (user_id, status, updated_at desc);
create index user_games_game_idx on public.user_games (game_id);
create trigger user_games_touch before update on public.user_games
  for each row execute function public.touch_updated_at();

-- ───────────────────────── Diary ─────────────────────────
create table public.play_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  game_id     uuid not null references public.games (id) on delete cascade,
  kind        public.play_session_kind not null default 'first_playthrough',
  started_on  date not null,
  finished_on date,
  note        text not null default '' check (char_length(note) <= 500),
  created_at  timestamptz not null default now(),
  check (finished_on is null or finished_on >= started_on)
);
create index play_sessions_user_idx on public.play_sessions (user_id, started_on desc);

-- ───────────────────────── Reviews & ratings ─────────────────────────
create table public.reviews (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  game_id           uuid not null references public.games (id) on delete cascade,
  rating            numeric(2, 1)
                    check (rating is null or (rating between 0.5 and 5 and rating * 2 = floor(rating * 2))),
  body              text check (body is null or char_length(body) between 1 and 5000),
  contains_spoilers boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, game_id),
  check (rating is not null or body is not null)
);
create index reviews_game_idx on public.reviews (game_id, created_at desc);
create index reviews_user_idx on public.reviews (user_id, updated_at desc);
create index reviews_recent_idx on public.reviews (created_at desc);
create trigger reviews_touch before update on public.reviews
  for each row execute function public.touch_updated_at();

-- ───────────────────────── Follows ─────────────────────────
create table public.follows (
  follower_id  uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index follows_following_idx on public.follows (following_id);

-- ───────────────────────── Lists ─────────────────────────
create table public.lists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 100),
  description text not null default '' check (char_length(description) <= 1000),
  visibility  public.list_visibility not null default 'public',
  featured    boolean not null default false,        -- editorial; staff only
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index lists_public_recent_idx on public.lists (created_at desc) where visibility = 'public';
create index lists_user_idx on public.lists (user_id, updated_at desc);
create trigger lists_touch before update on public.lists
  for each row execute function public.touch_updated_at();

create table public.list_items (
  id       uuid primary key default gen_random_uuid(),
  list_id  uuid not null references public.lists (id) on delete cascade,
  game_id  uuid not null references public.games (id) on delete cascade,
  position integer not null check (position >= 0),
  added_at timestamptz not null default now(),
  unique (list_id, game_id),                                   -- no duplicate games in a list
  constraint list_items_position_key unique (list_id, position) deferrable initially deferred
);

-- Only staff (dashboard / service role) may change the featured flag.
create function public.guard_list_featured() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon')
     and ((tg_op = 'INSERT' and new.featured) or (tg_op = 'UPDATE' and new.featured is distinct from old.featured)) then
    raise exception 'featured is editorial-only' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger lists_featured_guard before insert or update on public.lists
  for each row execute function public.guard_list_featured();

-- Create or update a list and its ordered games atomically.
-- Runs with the caller's permissions, so RLS still applies.
create function public.save_list(
  p_id uuid,
  p_title text,
  p_description text,
  p_visibility public.list_visibility,
  p_game_ids uuid[]
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if coalesce(array_length(p_game_ids, 1), 0) > 250 then
    raise exception 'a list can hold at most 250 games';
  end if;
  if (select count(*) from unnest(p_game_ids) g) <> (select count(distinct g) from unnest(p_game_ids) g) then
    raise exception 'a game can only appear once in a list';
  end if;

  insert into public.lists as l (id, user_id, title, description, visibility)
  values (p_id, v_uid, p_title, coalesce(p_description, ''), p_visibility)
  on conflict (id) do update
    set title = excluded.title, description = excluded.description, visibility = excluded.visibility
    where l.user_id = v_uid
  returning l.id into v_id;

  if v_id is null then
    raise exception 'list not found' using errcode = '42501';
  end if;

  delete from public.list_items where list_id = v_id and not (game_id = any (coalesce(p_game_ids, '{}')));
  insert into public.list_items (list_id, game_id, position)
  select v_id, g, (ord - 1)::int from unnest(coalesce(p_game_ids, '{}')) with ordinality as t (g, ord)
  on conflict (list_id, game_id) do update set position = excluded.position;

  return v_id;
end $$;

-- ───────────────────────── Favorite games (max 5) ─────────────────────────
create table public.user_favorite_games (
  user_id  uuid not null references public.profiles (id) on delete cascade,
  game_id  uuid not null references public.games (id) on delete cascade,
  position smallint not null check (position between 0 and 4),     -- caps favorites at 5
  constraint user_favorite_games_pkey primary key (user_id, position) deferrable initially deferred,
  unique (user_id, game_id)
);

-- Replace the caller's favorites with an ordered list (atomic).
create function public.set_favorite_games(p_game_ids uuid[]) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if coalesce(array_length(p_game_ids, 1), 0) > 5 then
    raise exception 'you can pick up to 5 favorite games';
  end if;
  delete from public.user_favorite_games where user_id = v_uid;
  insert into public.user_favorite_games (user_id, game_id, position)
  select v_uid, g, (ord - 1)::smallint from unnest(coalesce(p_game_ids, '{}')) with ordinality as t (g, ord);
end $$;

-- ───────────────────────── Activity feed ─────────────────────────
-- Written only by triggers below (never directly by clients), one event per
-- user/game/type so repeated changes don't flood the feed.
create table public.activities (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       public.activity_type not null,
  game_id    uuid not null references public.games (id) on delete cascade,
  review_id  uuid references public.reviews (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, game_id, type)
);
create index activities_user_recent_idx on public.activities (user_id, created_at desc);
create index activities_recent_idx on public.activities (created_at desc);

create function public.record_library_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_type public.activity_type;
begin
  if tg_op = 'UPDATE' and new.status = old.status then
    return new;
  end if;
  v_type := case new.status
    when 'want_to_play' then 'added_to_library'
    when 'playing' then 'started_playing'
    when 'completed' then 'completed'
    else null
  end;
  if v_type is not null then
    insert into public.activities (user_id, type, game_id)
    values (new.user_id, v_type, new.game_id)
    on conflict (user_id, game_id, type) do update set created_at = now();
  end if;
  return new;
end $$;
create trigger user_games_activity after insert or update on public.user_games
  for each row execute function public.record_library_activity();

create function public.record_review_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.activities (user_id, type, game_id, review_id)
  values (new.user_id, 'published_review', new.game_id, new.id)
  on conflict (user_id, game_id, type) do update set created_at = now(), review_id = excluded.review_id;
  return new;
end $$;
create trigger reviews_activity after insert on public.reviews
  for each row execute function public.record_review_activity();

-- ───────────────────────── Row Level Security ─────────────────────────
alter table public.profiles            enable row level security;
alter table public.games               enable row level security;
alter table public.user_games          enable row level security;
alter table public.play_sessions       enable row level security;
alter table public.reviews             enable row level security;
alter table public.follows             enable row level security;
alter table public.lists               enable row level security;
alter table public.list_items          enable row level security;
alter table public.user_favorite_games enable row level security;
alter table public.activities          enable row level security;

-- Public reads (account privacy will narrow these in a later phase).
create policy "profiles are readable"   on public.profiles            for select using (true);
create policy "games are readable"      on public.games               for select using (true);
create policy "library is readable"     on public.user_games          for select using (true);
create policy "diary is readable"       on public.play_sessions       for select using (true);
create policy "reviews are readable"    on public.reviews             for select using (true);
create policy "follows are readable"    on public.follows             for select using (true);
create policy "favorites are readable"  on public.user_favorite_games for select using (true);
create policy "activity is readable"    on public.activities          for select using (true);

-- Owners manage their own rows. (select auth.uid()) is evaluated once per query.
create policy "own profile update" on public.profiles for update
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "own library insert" on public.user_games for insert with check (user_id = (select auth.uid()));
create policy "own library update" on public.user_games for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own library delete" on public.user_games for delete using (user_id = (select auth.uid()));

create policy "own diary insert" on public.play_sessions for insert with check (user_id = (select auth.uid()));
create policy "own diary update" on public.play_sessions for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own diary delete" on public.play_sessions for delete using (user_id = (select auth.uid()));

create policy "own reviews insert" on public.reviews for insert with check (user_id = (select auth.uid()));
create policy "own reviews update" on public.reviews for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own reviews delete" on public.reviews for delete using (user_id = (select auth.uid()));

create policy "own favorites insert" on public.user_favorite_games for insert with check (user_id = (select auth.uid()));
create policy "own favorites delete" on public.user_favorite_games for delete using (user_id = (select auth.uid()));

create policy "own follows insert" on public.follows for insert with check (follower_id = (select auth.uid()));
create policy "own follows delete" on public.follows for delete using (follower_id = (select auth.uid()));

-- Lists: public lists readable by anyone; private lists only by their owner.
create policy "visible lists" on public.lists for select
  using (visibility = 'public' or user_id = (select auth.uid()));
create policy "own lists insert" on public.lists for insert with check (user_id = (select auth.uid()));
create policy "own lists update" on public.lists for update
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own lists delete" on public.lists for delete using (user_id = (select auth.uid()));

-- List items follow their list's visibility and ownership.
create policy "visible list items" on public.list_items for select using (
  exists (select 1 from public.lists l
          where l.id = list_id and (l.visibility = 'public' or l.user_id = (select auth.uid())))
);
create policy "own list items insert" on public.list_items for insert with check (
  exists (select 1 from public.lists l where l.id = list_id and l.user_id = (select auth.uid()))
);
create policy "own list items update" on public.list_items for update using (
  exists (select 1 from public.lists l where l.id = list_id and l.user_id = (select auth.uid()))
);
create policy "own list items delete" on public.list_items for delete using (
  exists (select 1 from public.lists l where l.id = list_id and l.user_id = (select auth.uid()))
);

-- Activities and games have no write policies: only triggers / the server write them.

-- Functions callable from the app.
revoke execute on function public.save_list(uuid, text, text, public.list_visibility, uuid[]) from public, anon;
revoke execute on function public.set_favorite_games(uuid[]) from public, anon;
grant execute on function public.save_list(uuid, text, text, public.list_visibility, uuid[]) to authenticated;
grant execute on function public.set_favorite_games(uuid[]) to authenticated;
grant execute on function public.is_username_available(text) to anon, authenticated;
-- Trigger functions must not be callable directly.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.record_library_activity() from public, anon, authenticated;
revoke execute on function public.record_review_activity() from public, anon, authenticated;
