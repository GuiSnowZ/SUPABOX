-- Phase 2: favorite games must be completed AND rated; profile picture uploads.

-- ───────────────────────── Favorites eligibility ─────────────────────────
-- A game can be added to favorites only if the user marked it Completed and
-- gave it a star rating. Favorites saved before this rule existed are kept
-- (they can be reordered or removed, but new picks must qualify).
--
-- The function is now the only way to add favorites: direct inserts are no
-- longer allowed, so it runs as its owner (security definer) and checks the
-- caller itself. Removing rows directly is still allowed by RLS.
drop policy "own favorites insert" on public.user_favorite_games;

create or replace function public.set_favorite_games(p_game_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_bad uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if coalesce(array_length(p_game_ids, 1), 0) > 5 then
    raise exception 'you can pick up to 5 favorite games';
  end if;
  if (select count(distinct g) from unnest(coalesce(p_game_ids, '{}')) as t (g)) <> coalesce(array_length(p_game_ids, 1), 0) then
    raise exception 'each favorite can appear only once';
  end if;
  select g into v_bad
  from unnest(coalesce(p_game_ids, '{}')) as t (g)
  where not exists (select 1 from public.user_favorite_games f where f.user_id = v_uid and f.game_id = t.g)
    and not (
      exists (select 1 from public.user_games u where u.user_id = v_uid and u.game_id = t.g and u.status = 'completed')
      and exists (select 1 from public.reviews r where r.user_id = v_uid and r.game_id = t.g and r.rating is not null)
    )
  limit 1;
  if v_bad is not null then
    raise exception 'favorites must be games you completed and rated' using errcode = '22023';
  end if;
  delete from public.user_favorite_games where user_id = v_uid;
  insert into public.user_favorite_games (user_id, game_id, position)
  select v_uid, g, (ord - 1)::smallint from unnest(coalesce(p_game_ids, '{}')) with ordinality as t (g, ord);
end $$;
revoke execute on function public.set_favorite_games(uuid[]) from public, anon;
grant execute on function public.set_favorite_games(uuid[]) to authenticated;

-- ───────────────────────── Profile pictures ─────────────────────────
-- Files live in the public "avatars" bucket at "<user id>/<random>.webp".
-- The browser resizes and converts the image before upload.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 524288, array['image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Anyone can view avatars through the public URL; only the owner can list,
-- upload, replace or delete files in their own folder.
create policy "avatars: owner reads own folder" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: owner uploads to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: owner updates own folder" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: owner deletes own folder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- A profile can only point at a picture inside its own folder.
alter table public.profiles
  add constraint profiles_avatar_path_own_folder
  check (avatar_path is null or avatar_path ~ ('^' || id::text || '/[a-z0-9-]{1,64}\.webp$'));
