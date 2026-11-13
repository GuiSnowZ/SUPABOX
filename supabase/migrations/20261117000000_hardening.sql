-- Pre-launch hardening.

-- 1. A like or comment updates the counters on a review/list. That isn't an
--    edit, so it must not move updated_at (reviews were showing "edited").
create function public.touch_content_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.like_count is distinct from old.like_count or new.comment_count is distinct from old.comment_count then
    new.updated_at = old.updated_at;
  else
    new.updated_at = now();
  end if;
  return new;
end $$;
revoke execute on function public.touch_content_updated_at() from public, anon, authenticated;

drop trigger reviews_touch on public.reviews;
create trigger reviews_touch before update on public.reviews
  for each row execute function public.touch_content_updated_at();
drop trigger lists_touch on public.lists;
create trigger lists_touch before update on public.lists
  for each row execute function public.touch_content_updated_at();

-- 2. Comment flood protection: at most 10 comments a minute and 300 a day per person.
create index comments_user_recent_idx on public.comments (user_id, created_at desc);

create function public.limit_comment_rate() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.comments
      where user_id = new.user_id and created_at > now() - interval '1 minute') >= 10
     or (select count(*) from public.comments
      where user_id = new.user_id and created_at > now() - interval '1 day') >= 300 then
    raise exception 'You''re commenting too fast. Please wait a moment.' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke execute on function public.limit_comment_rate() from public, anon, authenticated;

create trigger comments_rate_limit before insert on public.comments
  for each row execute function public.limit_comment_rate();
