# Supabox — Architecture

## Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | **Next.js 16.4** (App Router, Turbopack, Cache Components + Partial Prefetching on) | Server components by default |
| UI | React 19.3, TypeScript (strict), Tailwind CSS 4.3 | Design tokens in `src/app/globals.css` |
| Icons | lucide-react | One consistent icon set |
| Tests | Vitest | Pure logic tests in `src/**/*.test.ts` |
| Backend | Supabase: Postgres, Auth, RLS (Storage later) | `@supabase/ssr` + `@supabase/supabase-js` |
| Hosting (later) | Vercel | Not deployed |

The project uses its own small UI primitives (in the style of shadcn/ui) rather than installing shadcn/ui. See DECISIONS.md, entry D-004.

## Folder structure

```
src/
├── app/                      Routes (App Router)
│   ├── (auth)/               sign-in, sign-up, forgot-password (UI only)
│   ├── games/ [slug]/        Discovery + game details (prerendered per game)
│   ├── library/ wishlist/    Personal library and wishlist
│   ├── lists/ new/ [id]/ edit/
│   ├── reviews/              My Reviews / Following
│   ├── profile/ edit/        Own profile
│   └── users/[username]/     Public profiles
├── components/
│   ├── ui/                   Button, inputs, Card, Badge, Avatar, StarRating, ConfirmButton…
│   ├── layout/               SiteHeader, MobileTabBar, Footer, overlays, RequireUser
│   ├── games/ reviews/ lists/ profiles/ home/ auth/
├── features/app/             Data layer: store.ts, db.ts, auth.ts, state.ts (pure), selectors.ts
├── lib/
│   ├── catalog/              CatalogProvider interface + mock provider
│   ├── ratings.ts library.ts utils.ts
├── data/                     Fictional seed data (games, people, reviews, lists)
├── hooks/  types/
supabase/migrations/          Draft SQL (not applied)
docs/
```

## Data flow (Phase 2)

```
Server components ──► lib/catalog (bundled mock catalog, same UUIDs as the games table)
Client components ──► features/app/store.ts (useSyncExternalStore cache)
   reads:  loaders.* → db.ts queries → Supabase (RLS) → merged into the cache
   writes: actions.* → state.ts transition (validate + optimistic) → db.ts write → Supabase (RLS)
           on error → roll back + friendly message
   auth:   features/app/auth.ts → Supabase Auth (cookies via @supabase/ssr)
src/proxy.ts refreshes the auth cookie on navigation; /auth/confirm handles email links.
```

- **Stale-read protection**: if a write happens while a fetch is in flight, the fetch result is discarded and fetched again, so deleted items can't reappear.
- **Loaders**: `bootstrap` loads your own data plus community highlights, then `game:<id>`, `user:<username>` and `list:<id>` load on demand. `useLoad(key, fn)` triggers them and returns a status for skeletons and error states.
- **Security**: the browser only has the publishable key. Every read and write passes through RLS, which `supabase/tests/schema.test.mjs` checks (41 checks).
- **Supabase clients**: `lib/supabase/client.ts` (browser), `server.ts` (route handlers, with cookies) and `public.ts` (anonymous, for page metadata).

## Game catalogue

`lib/catalog/provider.ts` defines `CatalogProvider` (`listGames`, `getGameBySlug`, `searchGames`, `getRecentlyReleased`, `getUpcoming`). User data refers to our own stable `games.id`. Provider IDs live in `(provider, provider_id)`, so we can switch providers without touching user data.

Release status is derived from the date (`getReleaseStatus`) rather than stored, so it never goes stale. The mock catalogue pins "today" to `2026-11-10` to stay consistent with the seed data.

Cover art in the prototype is generated SVG (`GameCover`) built from palette and motif parameters, so no third-party artwork is used. Phase 3 replaces it with licensed images through `next/image`, keeping the same 3:4 frame.

### Provider selection (Phase 3, not yet decided)
Before choosing a provider (IGDB or others), we must check: API terms, commercial use, image licensing, rate limits, caching rules, attribution and long-term viability. **None of these have been verified yet.**

## Database

See `supabase/migrations/` (schema plus catalog seed). Tests: `npm run test:db`.

| Table | Purpose | Key constraints |
| --- | --- | --- |
| `profiles` | Public user info; `id = auth.users.id` | unique `username` (citext) |
| `games` | Catalogue cache | unique `slug`, unique `(provider, provider_id)` |
| `user_games` | Library status (**also the wishlist**) | PK `(user_id, game_id)` |
| `play_sessions` | Diary entries / playthroughs | `finished_on >= started_on` |
| `reviews` | Rating and/or text | unique `(user_id, game_id)`, half-step rating check |
| `follows` | Social graph | PK `(follower_id, following_id)`, no self-follow |
| `lists` / `list_items` | Curated lists | unique `(list_id, game_id)`, deferrable unique position |
| `user_favorite_games` | Up to 5 ordered favourites | `position between 0 and 4`, PK `(user_id, position)` |
| `activities` | Feed events | unique `(user_id, game_id, type)` to de-duplicate |

**RLS:** public read on public data. Owners write their own rows. Private lists and their items are readable by the owner only. `featured` can only be changed by the service role. Games are written by the server only.

**Deletion:** `on delete cascade` from `profiles`, so deleting an account removes the user's data (LGPD). Moderation and soft-delete will be designed in Phase 4.

**Review feed:** a join of `reviews` with `follows` where `follower_id = me`, ordered by `created_at desc`. There are no copied review rows.

## Rendering notes (Next.js 16 with Cache Components)
- Game, list and user pages use `generateStaticParams` for known IDs. Code that reads params sits inside `<Suspense>`, so the static shell renders instantly.
- `usePathname` in the navigation is wrapped in Suspense, with a fallback that shows no active tab.
- Lists created in the session have IDs only the browser knows. Their pages show a skeleton until the client store hydrates.

## Future expansion
- **Mobile (Expo/React Native):** keep domain logic (`types`, `lib/ratings`, the transitions in `state.ts`) free of React and DOM dependencies so it can move into a shared package.
- **i18n (pt-BR):** move UI strings to message catalogues. `profiles.locale` already exists.
- **PWA** for desktop install.
