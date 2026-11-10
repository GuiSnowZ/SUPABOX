-- When a game is removed from a user's library, remove that game's library
-- events (added / started / completed) from the activity feed so the feed
-- never shows games the user no longer tracks. Review events are unaffected.

create function public.remove_library_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.activities
  where user_id = old.user_id
    and game_id = old.game_id
    and type in ('added_to_library', 'started_playing', 'completed');
  return old;
end $$;

create trigger user_games_activity_cleanup after delete on public.user_games
  for each row execute function public.remove_library_activity();

revoke execute on function public.remove_library_activity() from public, anon, authenticated;

-- One-off cleanup: library events for games that are no longer in the library.
delete from public.activities a
where a.type in ('added_to_library', 'started_playing', 'completed')
  and not exists (
    select 1 from public.user_games ug where ug.user_id = a.user_id and ug.game_id = a.game_id
  );
