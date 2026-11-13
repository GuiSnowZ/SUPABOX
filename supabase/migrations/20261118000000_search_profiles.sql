-- People search for the Search tab: match by @username or display name and
-- rank the most active / followed people first.
--
-- rank = an exact @username match first, then
--        3 × followers + 2 × written reviews + 1 × rated games (desc), then username.
-- Everything it reads is already public (profiles, follows, reviews).

create function public.search_profiles(p_query text, p_limit integer default 8)
returns table (
  id uuid,
  username text,
  display_name text,
  bio text,
  avatar_hue smallint,
  avatar_path text,
  created_at timestamptz,
  followers bigint,
  reviews bigint,
  rated bigint
)
language sql stable set search_path = '' as $$
  with q as (
    -- Lower-case, drop a leading @, and escape LIKE wildcards so they match literally.
    select replace(replace(replace(lower(btrim(ltrim(btrim(coalesce(p_query, '')), '@'))), '\', '\\'), '%', '\%'), '_', '\_') as term,
           lower(btrim(ltrim(btrim(coalesce(p_query, '')), '@'))) as exact
  ),
  hits as (
    select p.id, p.username::text as username, p.display_name, p.bio, p.avatar_hue, p.avatar_path, p.created_at,
           (select count(*) from public.follows f where f.following_id = p.id) as followers,
           (select count(*) from public.reviews r where r.user_id = p.id and r.body is not null) as reviews,
           (select count(*) from public.reviews r where r.user_id = p.id and r.rating is not null) as rated,
           lower(p.username::text) = q.exact as exact_match
    from public.profiles p, q
    where char_length(q.exact) >= 2
      and (lower(p.username::text) like '%' || q.term || '%' or lower(p.display_name) like '%' || q.term || '%')
  )
  select h.id, h.username, h.display_name, h.bio, h.avatar_hue, h.avatar_path, h.created_at, h.followers, h.reviews, h.rated
  from hits h
  order by h.exact_match desc, (3 * h.followers + 2 * h.reviews + h.rated) desc, h.username
  limit least(greatest(coalesce(p_limit, 8), 1), 20)
$$;

grant execute on function public.search_profiles(text, integer) to anon, authenticated;
