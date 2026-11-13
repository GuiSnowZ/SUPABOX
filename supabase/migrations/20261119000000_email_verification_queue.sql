-- Email confirmation without blocking sign-up.
--
-- New accounts can use Supabox right away; Supabox sends its own confirmation
-- email (via Resend) when the daily email budget allows, otherwise the account
-- waits in a queue and the email goes out the next day. Until confirmed, the
-- account can do everything for itself but can't comment (anti-spam).
--
-- Accounts created before this migration have no row here and count as confirmed.

create table public.email_verifications (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  email       text not null,
  token_hash  text unique,                 -- sha256 of the emailed token; the token itself is never stored
  status      text not null default 'queued' check (status in ('queued', 'sent', 'verified')),
  send_count  integer not null default 0,
  created_at  timestamptz not null default now(),
  sent_at     timestamptz,
  verified_at timestamptz
);
create index email_verifications_queue_idx on public.email_verifications (created_at) where status = 'queued';

alter table public.email_verifications enable row level security;
-- People can see their own status (for the reminder banner). Only the server writes.
create policy "own verification read" on public.email_verifications for select using (user_id = (select auth.uid()));

-- Confirmed = no pending row (older accounts) or a verified one.
create function public.is_email_verified(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select not exists (
    select 1 from public.email_verifications v where v.user_id = p_user and v.status <> 'verified'
  )
$$;
grant execute on function public.is_email_verified(uuid) to anon, authenticated;

-- Comments need a confirmed email.
drop policy "own comments insert" on public.comments;
create policy "own comments insert" on public.comments for insert
  with check (
    user_id = (select auth.uid())
    and public.is_email_verified((select auth.uid()))
    and (review_id is not null or public.can_see_list(list_id))
  );

-- ───────────────────────── Daily email budget ─────────────────────────
-- Resend's free plan allows 100 emails a day; part of that is kept for
-- Supabase's own emails (password resets). The server claims a slot before
-- each confirmation email; when the day's budget is used up, it queues.
create table public.email_send_log (
  day   date primary key,
  sent  integer not null default 0 check (sent >= 0)
);
alter table public.email_send_log enable row level security;
-- No policies: only the server (service role) uses it.

create function public.claim_email_slot(p_daily_limit integer) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_ok boolean;
begin
  insert into public.email_send_log (day, sent) values (v_today, 0) on conflict (day) do nothing;
  update public.email_send_log set sent = sent + 1
  where day = v_today and sent < p_daily_limit
  returning true into v_ok;
  return coalesce(v_ok, false);
end $$;
revoke execute on function public.claim_email_slot(integer) from public, anon, authenticated;
