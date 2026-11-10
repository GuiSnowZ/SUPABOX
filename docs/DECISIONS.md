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
