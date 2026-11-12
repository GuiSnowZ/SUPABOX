-- Safari can't encode WebP in the browser, so profile pictures may also be JPEG.
update storage.buckets
set allowed_mime_types = array['image/webp', 'image/jpeg']
where id = 'avatars';

alter table public.profiles drop constraint profiles_avatar_path_own_folder;
alter table public.profiles
  add constraint profiles_avatar_path_own_folder
  check (avatar_path is null or avatar_path ~ ('^' || id::text || '/[a-z0-9-]{1,64}\.(webp|jpg)$'));
