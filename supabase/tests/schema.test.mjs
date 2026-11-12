// Applies every migration to an in-memory Postgres (PGlite) with a minimal
// stub of Supabase's auth schema and API roles, then checks constraints,
// triggers, RPCs and Row Level Security as different users.
// Run: npm run test:db
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";

const migDir = fileURLToPath(new URL("../migrations", import.meta.url));
const db = new PGlite({ extensions: { citext, pg_trgm } });

await db.exec(`
  create schema auth; create schema extensions;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  grant usage on schema public, extensions, auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated;
  -- Minimal stub of Supabase Storage (buckets, objects with RLS, foldername()).
  create schema storage;
  create table storage.buckets (id text primary key, name text not null, public boolean default false,
    file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets (id),
    name text not null, owner uuid);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as
    $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  grant usage on schema storage to anon, authenticated, service_role;
  grant select, insert, update, delete on storage.objects to anon, authenticated, service_role;
`);
for (const f of readdirSync(migDir).filter((f) => f.endsWith(".sql")).sort()) {
  await db.exec(readFileSync(join(migDir, f), "utf8"));
  console.log("applied", f);
}
// Supabase grants table privileges to API roles by default; RLS does the filtering.
await db.exec(`grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;`);

// The mock catalog is removed by the real-catalog migration; tests use their own games.
const mockLeft = (await db.query("select count(*)::int n from public.games")).rows[0].n;
for (let i = 1; i <= 7; i++) {
  const id = `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
  await db.query(
    "insert into public.games (id, slug, title, provider, provider_id, popularity) values ($1, $2, $3, 'igdb', $4, $5)",
    [id, `test-game--${i}`, `Test Game ${i}`, String(9000 + i), i],
  );
}

let failures = 0;
const ok = (name, cond) => { console.log(`${cond ? "PASS" : "FAIL"}  ${name}`); if (!cond) failures++; };
const as = async (uid, sql, params) => {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid ?? ""}', false);`);
  await db.exec(uid ? "set role authenticated" : "set role anon");
  try { return await db.query(sql, params); } finally { await db.exec("reset role"); }
};
const fails = async (uid, sql, params) => { try { await as(uid, sql, params); return false; } catch { return true; } };

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const G1 = "00000000-0000-4000-8000-000000000001", G2 = "00000000-0000-4000-8000-000000000002";
const ids = (n) => Array.from({ length: n }, (_, i) => `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`);

// Sign-up trigger
await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, 'a@x.test', '{"username":"Alice_1","display_name":"Alice"}'), ($2, 'b@x.test', '{"username":"bad name!"}')`, [A, B]);
const profs = (await db.query("select id, username, display_name, avatar_hue from public.profiles order by username")).rows;
ok("profiles auto-created for both users", profs.length === 2);
ok("username lower-cased", profs.some((p) => p.username === "alice_1" && p.display_name === "Alice"));
ok("invalid username falls back to player_*", profs.some((p) => p.username.startsWith("player_")));
ok("taken username (any case) is unavailable", (await as(null, "select public.is_username_available('ALICE_1') v")).rows[0].v === false);
ok("free username is available", (await as(null, "select public.is_username_available('zed') v")).rows[0].v === true);
ok("mock catalog removed by migration", mockLeft === 0);
ok("IGDB-style slugs with double dashes are allowed", (await db.query("select count(*)::int n from public.games where slug like '%--%'")).rows[0].n === 7);
ok("bad slugs are rejected", await fails(null, "select 1") === false && (await (async () => { try { await db.query("insert into public.games (slug, title, provider, provider_id) values ('Bad Slug!', 'x', 'igdb', 'x1')"); return false; } catch { return true; } })()));
ok("title search uses trigram index-compatible query", (await db.query("select count(*)::int n from public.games where lower(title) like '%game 3%'")).rows[0].n === 1);

// Library / wishlist
await as(A, "insert into public.user_games (user_id, game_id, status) values ($1, $2, 'want_to_play')", [A, G1]);
ok("cannot wishlist the same game twice", await fails(A, "insert into public.user_games (user_id, game_id, status) values ($1, $2, 'want_to_play')", [A, G1]));
ok("cannot write another user's library", await fails(A, "insert into public.user_games (user_id, game_id, status) values ($1, $2, 'playing')", [B, G1]));
ok("anon cannot write library", await fails(null, "insert into public.user_games (user_id, game_id, status) values ($1, $2, 'playing')", [A, G2]));
await as(A, "update public.user_games set status = 'playing' where user_id = $1 and game_id = $2", [A, G1]);
await as(A, "update public.user_games set status = 'completed' where user_id = $1 and game_id = $2", [A, G1]);
await as(A, "update public.user_games set status = 'playing' where user_id = $1 and game_id = $2", [A, G1]);
const acts = (await db.query("select type, count(*)::int n from public.activities where user_id = $1 group by type", [A])).rows;
ok("activities recorded once per type", acts.length === 3 && acts.every((a) => a.n === 1));
ok("clients cannot forge activities", await fails(A, "insert into public.activities (user_id, type, game_id) values ($1, 'completed', $2)", [A, G2]));
const bUpd = await as(B, "update public.user_games set status = 'dropped' where user_id = $1 returning *", [A]);
ok("other user's update affects 0 rows", bUpd.rows.length === 0);

// Removing a game from the library removes its library events (not reviews)
await as(A, "insert into public.user_games (user_id, game_id, status) values ($1, $2, 'playing')", [A, G2]);
await as(A, "delete from public.user_games where user_id = $1 and game_id = $2", [A, G2]);
ok("library removal clears its feed events", (await db.query("select count(*)::int n from public.activities where user_id = $1 and game_id = $2", [A, G2])).rows[0].n === 0);

// Reviews
await as(A, "insert into public.reviews (user_id, game_id, rating, body) values ($1, $2, 4.5, 'Great')", [A, G1]);
ok("one review per user/game", await fails(A, "insert into public.reviews (user_id, game_id, rating) values ($1, $2, 3)", [A, G1]));
ok("rating must be half-steps", await fails(A, "insert into public.reviews (user_id, game_id, rating) values ($1, $2, 4.3)", [A, G2]));
ok("rating max 5", await fails(A, "insert into public.reviews (user_id, game_id, rating) values ($1, $2, 5.5)", [A, G2]));
ok("rating or body required", await fails(A, "insert into public.reviews (user_id, game_id) values ($1, $2)", [A, G2]));
ok("review activity recorded", (await db.query("select count(*)::int n from public.activities where type='published_review'")).rows[0].n === 1);
const bDel = await as(B, "delete from public.reviews where user_id = $1 returning id", [A]);
ok("cannot delete others' reviews", bDel.rows.length === 0);
ok("anyone can read reviews", (await as(null, "select count(*)::int n from public.reviews")).rows[0].n === 1);

// Lists
const L1 = "33333333-3333-4333-8333-333333333333";
await as(A, "select public.save_list($1, 'Best', '', 'public', $2::uuid[])", [L1, [G1, G2]]);
await as(A, "select public.save_list($1, 'Best!', 'd', 'private', $2::uuid[])", [L1, [G2, G1]]);
const items = (await db.query("select game_id, position from public.list_items where list_id = $1 order by position", [L1])).rows;
ok("save_list reorders atomically", items.length === 2 && items[0].game_id === G2 && items[1].game_id === G1);
ok("save_list rejects duplicates", await fails(A, "select public.save_list($1, 'x', '', 'public', $2::uuid[])", [L1, [G1, G1]]));
ok("other user cannot overwrite list", await fails(B, "select public.save_list($1, 'hacked', '', 'public', $2::uuid[])", [L1, [G1]]));
ok("private list hidden from others", (await as(B, "select count(*)::int n from public.lists where id = $1", [L1])).rows[0].n === 0);
ok("private list items hidden from others", (await as(B, "select count(*)::int n from public.list_items where list_id = $1", [L1])).rows[0].n === 0);
ok("private list hidden from anon", (await as(null, "select count(*)::int n from public.lists")).rows[0].n === 0);
ok("owner sees private list", (await as(A, "select count(*)::int n from public.lists where id = $1", [L1])).rows[0].n === 1);
ok("users cannot feature their own list", await fails(A, "update public.lists set featured = true where id = $1", [L1]));
ok("users cannot insert featured list", await fails(A, "insert into public.lists (user_id, title, featured) values ($1, 'x', true)", [A]));
ok("anon cannot call save_list", await fails(null, "select public.save_list(gen_random_uuid(), 'x', '', 'public', '{}'::uuid[])"));
await db.exec("update public.lists set featured = true where id = '" + L1 + "'");
ok("staff (postgres) can feature lists", (await db.query("select featured from public.lists where id = $1", [L1])).rows[0].featured === true);

// Favorites: only games the user completed AND rated can be added.
ok("cannot favorite a game you haven't completed and rated", await fails(A, "select public.set_favorite_games($1::uuid[])", [[ids(7)[6]]]));
for (const g of ids(6)) {
  await as(A, "insert into public.user_games (user_id, game_id, status) values ($1, $2, 'completed') on conflict (user_id, game_id) do update set status = 'completed'", [A, g]);
}
ok("completed but unrated is still not eligible", await fails(A, "select public.set_favorite_games($1::uuid[])", [[ids(5)[4]]]));
for (const g of ids(6)) {
  await as(A, "insert into public.reviews (user_id, game_id, rating) values ($1, $2, 4) on conflict (user_id, game_id) do update set rating = 4", [A, g]);
}
await as(A, "select public.set_favorite_games($1::uuid[])", [ids(5)]);
await as(A, "select public.set_favorite_games($1::uuid[])", [[ids(5)[4], ...ids(4)]]);
const fav = (await db.query("select game_id from public.user_favorite_games where user_id = $1 order by position", [A])).rows;
ok("favorites keep order after reorder", fav.length === 5 && fav[0].game_id === ids(5)[4]);
ok("max five favorites (rpc)", await fails(A, "select public.set_favorite_games($1::uuid[])", [ids(6)]));
ok("duplicate favorites rejected", await fails(A, "select public.set_favorite_games($1::uuid[])", [[G1, G1]]));
ok("favorites cannot be inserted directly (bypassing the rules)", await fails(A, "insert into public.user_favorite_games (user_id, game_id, position) values ($1, $2, 4)", [A, ids(7)[6]]));
ok("anon cannot set favorites", await fails(null, "select public.set_favorite_games($1::uuid[])", [[G1]]));
// A favorite saved before the rule (grandfathered) can stay when reordering.
await db.query("update public.reviews set rating = null, body = 'meh' where user_id = $1 and game_id = $2", [A, ids(5)[4]]);
await as(A, "select public.set_favorite_games($1::uuid[])", [ids(5)]);
ok("existing favorite that no longer qualifies can be kept/reordered", (await db.query("select count(*)::int n from public.user_favorite_games where user_id = $1", [A])).rows[0].n === 5);
await as(A, "select public.set_favorite_games($1::uuid[])", [ids(4)]);
ok("…but once removed it can't be re-added", await fails(A, "select public.set_favorite_games($1::uuid[])", [ids(5)]));
await as(A, "delete from public.user_favorite_games where user_id = $1", [A]);
ok("owner can clear favorites directly", (await db.query("select count(*)::int n from public.user_favorite_games where user_id = $1", [A])).rows[0].n === 0);

// Official lists: readable when published, never writable by clients.
const OL = "33333333-3333-4333-8333-333333333333", OD = "44444444-4444-4444-8444-444444444444";
await db.query("insert into public.official_lists (id, slug, title, category, published) values ($1, 'best-rpgs', 'Best RPGs', 'genres', true), ($2, 'draft-list', 'Draft', 'special', false)", [OL, OD]);
await db.query("insert into public.official_list_items (list_id, position, game_id, section) values ($1, 0, $2, '1990s'), ($3, 0, $2, null)", [OL, G1, OD]);
ok("anyone can read published official lists", (await as(null, "select count(*)::int n from public.official_lists")).rows[0].n === 1);
ok("unpublished official lists are hidden", (await as(A, "select count(*)::int n from public.official_lists where id = $1", [OD])).rows[0].n === 0);
ok("items of unpublished lists are hidden", (await as(null, "select count(*)::int n from public.official_list_items where list_id = $1", [OD])).rows[0].n === 0);
ok("items of published lists are readable", (await as(null, "select count(*)::int n from public.official_list_items where list_id = $1", [OL])).rows[0].n === 1);
ok("users cannot create official lists", await fails(A, "insert into public.official_lists (slug, title, category, published) values ('mine', 'Mine', 'special', true)"));
ok("users cannot edit official list items", (await as(A, "update public.official_list_items set note = 'x' where list_id = $1 returning 1", [OL])).rows.length === 0);
ok("official list categories are restricted", await (async () => { try { await db.query("insert into public.official_lists (slug, title, category) values ('x', 'x', 'nope')"); return false; } catch { return true; } })());

// Avatars (storage)
const bucket = (await db.query("select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'avatars'")).rows[0];
ok("avatars bucket is public, small and webp-only", bucket?.public === true && Number(bucket.file_size_limit) === 524288 && bucket.allowed_mime_types.join() === "image/webp");
await as(A, "insert into storage.objects (bucket_id, name, owner) values ('avatars', $1, $2)", [`${A}/pic-1.webp`, A]);
ok("user can upload to own avatar folder", (await db.query("select count(*)::int n from storage.objects where name = $1", [`${A}/pic-1.webp`])).rows[0].n === 1);
ok("user cannot upload into another user's folder", await fails(A, "insert into storage.objects (bucket_id, name, owner) values ('avatars', $1, $2)", [`${B}/x.webp`, A]));
ok("anon cannot upload avatars", await fails(null, "insert into storage.objects (bucket_id, name) values ('avatars', $1)", [`${A}/y.webp`]));
ok("user cannot delete another user's avatar", (await as(B, "delete from storage.objects where name = $1 returning id", [`${A}/pic-1.webp`])).rows.length === 0);
await as(A, "update public.profiles set avatar_path = $2 where id = $1", [A, `${A}/pic-1.webp`]);
ok("profile can point at own avatar", (await db.query("select avatar_path from public.profiles where id = $1", [A])).rows[0].avatar_path === `${A}/pic-1.webp`);
ok("profile cannot point at someone else's file", await fails(A, "update public.profiles set avatar_path = $2 where id = $1", [A, `${B}/x.webp`]));
ok("profile avatar path must be a webp in the own folder", await fails(A, "update public.profiles set avatar_path = $2 where id = $1", [A, `${A}/../evil.png`]));

// Follows
await as(A, "insert into public.follows (follower_id, following_id) values ($1, $2)", [A, B]);
ok("cannot follow yourself", await fails(A, "insert into public.follows (follower_id, following_id) values ($1, $1)", [A]));
ok("cannot create follows for others", await fails(A, "insert into public.follows (follower_id, following_id) values ($1, $2)", [B, A]));

// Profiles
ok("cannot edit another profile", (await as(B, "update public.profiles set bio = 'x' where id = $1 returning id", [A])).rows.length === 0);
await as(A, "update public.profiles set bio = 'hello' where id = $1", [A]);
ok("can edit own profile", (await db.query("select bio from public.profiles where id = $1", [A])).rows[0].bio === "hello");
ok("games are read-only for users", await fails(A, "insert into public.games (slug, title, provider, provider_id) values ('x', 'x', 'm', '1')"));

// Diary
ok("finish date after start", await fails(A, "insert into public.play_sessions (user_id, game_id, started_on, finished_on) values ($1, $2, '2026-01-02', '2026-01-01')", [A, G1]));

// Account deletion cascades
await db.query("delete from auth.users where id = $1", [A]);
const left = (await db.query("select (select count(*) from public.reviews)::int r, (select count(*) from public.lists)::int l, (select count(*) from public.follows)::int f")).rows[0];
ok("deleting the account removes the user's data", left.r === 0 && left.l === 0 && left.f === 0);

console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
