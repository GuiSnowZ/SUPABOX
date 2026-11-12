-- Phase 5: diary entries can record hours played and the platform used.
alter table public.play_sessions
  add column hours numeric(6, 1) check (hours is null or (hours >= 0 and hours <= 10000)),
  add column platform text check (platform is null or char_length(platform) between 1 and 60);
