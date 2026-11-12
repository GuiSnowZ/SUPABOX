-- Phase 4: friend-activity notifications (with preferences and a per-friend
-- bell), likes and comments on reviews and lists.

-- ───────────────────────── Per-friend notification bell ─────────────────────────
alter table public.follows add column notify boolean not null default true;

create policy "own follows update" on public.follows for update
  using (follower_id = (select auth.uid())) with check (follower_id = (select auth.uid()));

-- Only the bell may change on an existing follow.
create function public.follows_only_notify_changes() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.follower_id <> old.follower_id or new.following_id <> old.following_id or new.created_at <> old.created_at then
    raise exception 'only the notification setting of a follow can be changed' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger follows_guard before update on public.follows
  for each row execute function public.follows_only_notify_changes();

-- ───────────────────────── Notification preferences ─────────────────────────
-- No row = everything on.
create table public.notification_preferences (
  user_id         uuid primary key references public.profiles (id) on delete cascade,
  library_adds    boolean not null default true,  -- a friend adds a game to their collection (or finishes one)
  started_playing boolean not null default true,  -- a friend marks a game as Playing
  reviews         boolean not null default true,  -- a friend rates or reviews a game
  likes           boolean not null default true,  -- someone likes your review or list
  comments        boolean not null default true,  -- someone comments on your review or list
  updated_at      timestamptz not null default now()
);
create trigger notification_preferences_touch before update on public.notification_preferences
  for each row execute function public.touch_updated_at();
alter table public.notification_preferences enable row level security;
create policy "own preferences read" on public.notification_preferences for select using (user_id = (select auth.uid()));
create policy "own preferences insert" on public.notification_preferences for insert with check (user_id = (select auth.uid()));
create policy "own preferences update" on public.notification_preferences for update
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ───────────────────────── Likes and comments ─────────────────────────
alter table public.reviews add column like_count integer not null default 0, add column comment_count integer not null default 0;
alter table public.lists add column like_count integer not null default 0, add column comment_count integer not null default 0;

-- Counters are maintained by triggers; clients can't set them.
create function public.protect_social_counters() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.like_count := 0;
      new.comment_count := 0;
    else
      new.like_count := old.like_count;
      new.comment_count := old.comment_count;
    end if;
  end if;
  return new;
end $$;
create trigger reviews_counters_guard before insert or update on public.reviews
  for each row execute function public.protect_social_counters();
create trigger lists_counters_guard before insert or update on public.lists
  for each row execute function public.protect_social_counters();

create table public.review_likes (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  review_id  uuid not null references public.reviews (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, review_id)
);
create index review_likes_review_idx on public.review_likes (review_id);

create table public.list_likes (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  list_id    uuid not null references public.lists (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, list_id)
);
create index list_likes_list_idx on public.list_likes (list_id);

create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  review_id  uuid references public.reviews (id) on delete cascade,
  list_id    uuid references public.lists (id) on delete cascade,
  body       text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  check ((review_id is null) <> (list_id is null))
);
create index comments_review_idx on public.comments (review_id, created_at) where review_id is not null;
create index comments_list_idx on public.comments (list_id, created_at) where list_id is not null;

alter table public.review_likes enable row level security;
alter table public.list_likes enable row level security;
alter table public.comments enable row level security;

-- A list is "visible" to the viewer if it's public or theirs (same rule as lists).
create function public.can_see_list(p_list_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.lists l
    where l.id = p_list_id and (l.visibility = 'public' or l.user_id = (select auth.uid()))
  )
$$;

create policy "review likes are readable" on public.review_likes for select using (true);
create policy "own review likes insert" on public.review_likes for insert with check (user_id = (select auth.uid()));
create policy "own review likes delete" on public.review_likes for delete using (user_id = (select auth.uid()));

create policy "list likes follow list visibility" on public.list_likes for select using (public.can_see_list(list_id));
create policy "own list likes insert" on public.list_likes for insert
  with check (user_id = (select auth.uid()) and public.can_see_list(list_id));
create policy "own list likes delete" on public.list_likes for delete using (user_id = (select auth.uid()));

create policy "comments follow their target's visibility" on public.comments for select
  using (review_id is not null or public.can_see_list(list_id));
create policy "own comments insert" on public.comments for insert
  with check (user_id = (select auth.uid()) and (review_id is not null or public.can_see_list(list_id)));
-- Authors can delete their comments; owners can remove comments on their review or list.
create policy "comments delete by author or owner" on public.comments for delete using (
  user_id = (select auth.uid())
  or exists (select 1 from public.reviews r where r.id = review_id and r.user_id = (select auth.uid()))
  or exists (select 1 from public.lists l where l.id = list_id and l.user_id = (select auth.uid()))
);

-- ───────────────────────── Notifications ─────────────────────────
create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references public.profiles (id) on delete cascade,
  actor_id      uuid not null references public.profiles (id) on delete cascade,
  kind          text not null check (kind in ('activity', 'review_like', 'list_like', 'review_comment', 'list_comment')),
  activity_type public.activity_type,
  game_id       uuid references public.games (id) on delete cascade,
  review_id     uuid references public.reviews (id) on delete cascade,
  list_id       uuid references public.lists (id) on delete cascade,
  comment_id    uuid references public.comments (id) on delete cascade,
  created_at    timestamptz not null default now(),
  read_at       timestamptz,
  check (recipient_id <> actor_id)
);
create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);
create index notifications_unread_idx on public.notifications (recipient_id) where read_at is null;

alter table public.notifications enable row level security;
create policy "own notifications read" on public.notifications for select using (recipient_id = (select auth.uid()));
create policy "own notifications mark read" on public.notifications for update
  using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));
create policy "own notifications delete" on public.notifications for delete using (recipient_id = (select auth.uid()));
-- No insert policy: notifications are created only by the triggers below.

-- Preference lookup (missing row = enabled).
create function public.wants_notification(p_user uuid, p_kind text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((
    select case p_kind
      when 'added_to_library' then p.library_adds
      when 'completed' then p.library_adds
      when 'started_playing' then p.started_playing
      when 'published_review' then p.reviews
      when 'like' then p.likes
      when 'comment' then p.comments
    end
    from public.notification_preferences p where p.user_id = p_user
  ), true)
$$;

-- A friend's activity → notify followers who have the bell on and the type enabled.
-- Repeats (e.g. toggling a status back and forth) replace the earlier notification.
create function public.notify_followers_of_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.created_at = old.created_at then
    return new;
  end if;
  delete from public.notifications n
  using public.follows f
  where f.following_id = new.user_id
    and n.recipient_id = f.follower_id and n.actor_id = new.user_id
    and n.kind = 'activity' and n.game_id = new.game_id and n.activity_type = new.type;
  insert into public.notifications (recipient_id, actor_id, kind, activity_type, game_id, review_id)
  select f.follower_id, new.user_id, 'activity', new.type, new.game_id, new.review_id
  from public.follows f
  where f.following_id = new.user_id
    and f.notify
    and public.wants_notification(f.follower_id, new.type::text);
  return new;
end $$;
create trigger activities_notify after insert or update on public.activities
  for each row execute function public.notify_followers_of_activity();

-- Likes: keep counters and notify the author.
create function public.on_review_like() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_author uuid;
  v_game uuid;
begin
  if tg_op = 'INSERT' then
    update public.reviews set like_count = like_count + 1 where id = new.review_id returning user_id, game_id into v_author, v_game;
    if v_author is not null and v_author <> new.user_id and public.wants_notification(v_author, 'like') then
      insert into public.notifications (recipient_id, actor_id, kind, review_id, game_id)
      values (v_author, new.user_id, 'review_like', new.review_id, v_game);
    end if;
    return new;
  end if;
  update public.reviews set like_count = greatest(like_count - 1, 0) where id = old.review_id;
  delete from public.notifications where kind = 'review_like' and actor_id = old.user_id and review_id = old.review_id;
  return old;
end $$;
create trigger review_likes_effects after insert or delete on public.review_likes
  for each row execute function public.on_review_like();

create function public.on_list_like() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
begin
  if tg_op = 'INSERT' then
    update public.lists set like_count = like_count + 1 where id = new.list_id returning user_id into v_owner;
    if v_owner is not null and v_owner <> new.user_id and public.wants_notification(v_owner, 'like') then
      insert into public.notifications (recipient_id, actor_id, kind, list_id) values (v_owner, new.user_id, 'list_like', new.list_id);
    end if;
    return new;
  end if;
  update public.lists set like_count = greatest(like_count - 1, 0) where id = old.list_id;
  delete from public.notifications where kind = 'list_like' and actor_id = old.user_id and list_id = old.list_id;
  return old;
end $$;
create trigger list_likes_effects after insert or delete on public.list_likes
  for each row execute function public.on_list_like();

-- Comments: keep counters and notify the review/list owner.
create function public.on_comment() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
  v_game uuid;
begin
  if tg_op = 'INSERT' then
    if new.review_id is not null then
      update public.reviews set comment_count = comment_count + 1 where id = new.review_id returning user_id, game_id into v_owner, v_game;
    else
      update public.lists set comment_count = comment_count + 1 where id = new.list_id returning user_id into v_owner;
    end if;
    if v_owner is not null and v_owner <> new.user_id and public.wants_notification(v_owner, 'comment') then
      insert into public.notifications (recipient_id, actor_id, kind, review_id, list_id, comment_id, game_id)
      values (v_owner, new.user_id, case when new.review_id is not null then 'review_comment' else 'list_comment' end,
              new.review_id, new.list_id, new.id, v_game);
    end if;
    return new;
  end if;
  if old.review_id is not null then
    update public.reviews set comment_count = greatest(comment_count - 1, 0) where id = old.review_id;
  else
    update public.lists set comment_count = greatest(comment_count - 1, 0) where id = old.list_id;
  end if;
  return old;
end $$;
create trigger comments_effects after insert or delete on public.comments
  for each row execute function public.on_comment();

-- Trigger and helper functions aren't callable through the API.
revoke execute on function public.follows_only_notify_changes() from public, anon, authenticated;
revoke execute on function public.protect_social_counters() from public, anon, authenticated;
revoke execute on function public.notify_followers_of_activity() from public, anon, authenticated;
revoke execute on function public.on_review_like() from public, anon, authenticated;
revoke execute on function public.on_list_like() from public, anon, authenticated;
revoke execute on function public.on_comment() from public, anon, authenticated;
revoke execute on function public.wants_notification(uuid, text) from public, anon, authenticated;
grant execute on function public.can_see_list(uuid) to anon, authenticated;
