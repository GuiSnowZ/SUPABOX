# Decision log

Each entry records what we decided and why. Newest last.

### D-001 — Web first with Next.js App Router (2026-11-10)
Next.js 16 with the App Router gives us server rendering for SEO-friendly game pages and a clear path to Vercel. React skills and domain logic carry over to Expo later.

### D-002 — Keep Next 16 defaults: Cache Components and Partial Prefetching (2026-11-10)
`create-next-app` enables both by default, and Next says they'll be mandatory in the next major version. Adopting them now avoids a migration later. As a result, components that read params or the pathname are wrapped in `<Suspense>`.

### D-003 — Phase 1 state is a session-only client store (2026-11-10)
The brief asks for interactions that work during the browser session, with no backend. We use one external store (`useSyncExternalStore`) mirrored to `sessionStorage`, with **pure transition functions** that include validation and ownership checks. This keeps the prototype honest (nothing is persistent) and lets the Phase 2 server actions reuse the same rules and tests.

### D-004 — Own UI primitives instead of installing shadcn/ui (2026-11-10)
We need only a handful of primitives. Writing them directly in Tailwind avoids pulling in Radix and the shadcn CLI scaffolding before we need complex widgets like comboboxes or popovers. We can add shadcn components later if they're justified.

### D-005 — The wishlist is the `want_to_play` library status (2026-11-10)
This avoids two sources of truth. One `user_games` row per user and game prevents duplicates. The wishlist toggle never overwrites another status (for example Completed), so the user can't lose progress with one tap.

### D-006 — One review per user per game; rating stored on the review (2026-11-10)
The rating and the text are both optional but at least one is required. This gives one review system rather than separate ratings and reviews tables. Replays are captured in the diary (`play_sessions`). Per-playthrough reviews can come later if users ask for them.

### D-007 — Release status is derived, not stored (2026-11-10)
"Released" means `release_date <= today`, and TBA counts as upcoming. A stored flag would go stale.

### D-008 — Original procedural cover art in the prototype (2026-11-10)
No unlicensed third-party images. Covers are generated SVGs from per-game palette and motif parameters. All games, studios and people are fictional.

### D-009 — Featured lists are editorial (2026-11-10)
Ranking lists by popularity would mean inventing engagement data. `lists.featured` is set by staff only, and an RLS trigger stops users setting it.

### D-010 — Favourites limited to five by the database (2026-11-10)
`user_favorite_games.position` is checked to the range 0–4, with a primary key on `(user_id, position)`. That makes a sixth favourite impossible even if the app has a bug. The client and the transition function validate it too.

### D-011 — Node.js 24 LTS installed per user (2026-11-10)
The machine had no Node.js. With your approval we installed the official, checksum-verified Node 24.22.2 into `~/.local/node` (no admin rights) and added it to `PATH` in `~/.zshrc`.

### D-012 — Client-side cache over Supabase with RLS (2026-11-10)
Phase 2 keeps the Phase 1 component interface (`useAppState`, selectors and `actions.*`) and backs it with Supabase instead of rewriting every page as a server component. Reads and writes go straight from the browser to Supabase with the user's session. **Row Level Security is the authorization layer**, and the PGlite tests verify it. Writes are optimistic: they reuse the pure Phase 1 transitions for validation and roll back if the database rejects them. We'll move hot read paths to server components when SEO or performance needs it.

### D-013 — Client-generated UUIDs for new rows (2026-11-10)
New reviews, lists and diary entries get their UUIDs from `crypto.randomUUID()` in the browser, so the optimistic UI and the database agree on the ID without a round trip. RLS still prevents writing rows for other users.

### D-014 — Activity feed written only by database triggers (2026-11-10)
Clients have no insert policy on `activities`. Triggers on `user_games` and `reviews` record events, with one event per user, game and type. This prevents forged or duplicated feed items.

### D-015 — Atomic RPCs for multi-row writes (2026-11-10)
`save_list` and `set_favorite_games` run as `security invoker`, so RLS still applies, and they update lists or favorites in a single transaction. Deferrable unique constraints on position allow reordering.

### D-016 — Mock catalog kept in the bundle with stable UUIDs (2026-11-10)
The fictional games are seeded into `games` with fixed UUIDs that match `src/data/games.ts`. That lets server components keep rendering game pages statically from the bundled data until the Phase 3 provider sync.

### D-017 — IGDB catalog: curated base plus import on demand (2026-11-10)
IGDB has about 284k games with covers. Storing all of them would approach the Supabase free-tier database limit and add little value. Instead we sync a base of about 9.5k games (last year's releases, hyped upcoming games, every game with 20+ ratings), and import any other game the first time someone searches for it or opens its page. IGDB's terms allow and prefer storing data locally.

### D-018 — Catalog writes use the Supabase secret key, server-side only (2026-11-10)
`games` still has no client write policies. The sync script and server-side imports use `SUPABASE_SECRET_KEY`, which is read only in `lib/supabase/admin.ts` (marked `server-only`) and in `scripts/`. It never gets a `NEXT_PUBLIC_` prefix and is never sent to browsers.

### D-019 — Images served directly from IGDB's CDN (2026-11-10)
Covers, logos and artwork use IGDB's pre-sized image URLs in plain `<img>` tags with lazy loading. Proxying them through Next's image optimizer would add cost (Vercel image quotas) for no visual gain. We may revisit this if we need our own caching or image formats.

### D-020 — Recently Released ranks by popularity, not date (2026-11-10)
Ordering strictly by date filled the section with small titles released that day. At your request, the section now shows the biggest releases of the last 60 days, most popular first (IGDB rating count plus hype; wider windows if there are too few). Coming Soon picks the most anticipated games of the next six months and shows them soonest first. Popularity stays current only while the catalog sync runs, which is why scheduling the sync is on the roadmap.

### D-021 — Critic scores come from IGDB, not Metacritic (2026-11-11)
Metacritic has no public API, and copying its scores would break its terms. IGDB's `aggregated_rating` (an average of professional outlet reviews) is part of the catalog we're already allowed to use. It's shown as "Critic score" with the number of reviews behind it, next to Supabox's own player rating. About half the catalog has one; unreleased games never do.

### D-022 — Paginated browsing with shareable URLs (2026-11-11)
`/games/new-releases` and `/games/coming-soon` use `?page=N` links (24 games per page, capped at 20 pages) rather than infinite scroll. Each page has its own address, the back button works, and pages work without JavaScript. Out-of-range pages redirect to the last page. Both lists are ordered by popularity, per D-020.
