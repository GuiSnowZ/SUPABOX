# Supabox — Roadmap

_Last updated: 2026-11-10_

## Phase 1 — Web prototype ✅ (approved)

Mock data only. No Supabase, real auth or external APIs.

- [x] Next.js 16 project with strict TypeScript, Tailwind 4, ESLint and Vitest
- [x] Design system: colour tokens, typography (Geist), buttons, inputs, cards, badges, avatars, star rating (display + half-star input), cover art, skeletons, empty states, toasts and dialogs
- [x] Global sticky top navigation (Games · Lists · Reviews · Profile) with active state; mobile bottom tab bar
- [x] Home: welcome hero for signed-out visitors, activity feed, featured releases, recent reviews
- [x] Games: search, **Recently Released** (released only, newest first), Coming Soon, quick wishlist toggle, loading, empty and error states
- [x] Game details: info, community rating with distribution, library status, wishlist, review editor, diary of playthroughs, reviews
- [x] Library with status filters and sorting; **Wishlist** page (Want to Play) with count and sorting
- [x] Lists: Featured / Recently Created / My Lists, create, edit (search, add, remove, reorder), delete, public/private, details page with authorisation
- [x] Reviews: My Reviews (edit/delete) and Following feed, with empty states
- [x] Profile: header, follow/unfollow, **Five Favorite Games** (add, remove, replace, reorder), **Recent Ratings**, Recently Played, Completed, Lists, Recent Reviews, Library and Wishlist links; edit profile
- [x] Sign-in, sign-up and password-recovery screens (UI only; "Continue as demo user")
- [x] Session-only prototype store with **Reset demo data**
- [x] Draft SQL schema with RLS (not applied)
- [x] Documentation

## Phase 2 — Authentication and database ✅ (live on Supabase, awaiting review)
- [x] Supabase clients (browser, server, anonymous) and session-refresh proxy (`src/proxy.ts`)
- [x] Schema with RLS, constraints, indexes and triggers (`supabase/migrations/`)
- [x] Automatic profile creation on sign-up; username availability check
- [x] Activity feed written by database triggers (clients cannot forge events)
- [x] Atomic `save_list` and `set_favorite_games` functions
- [x] Catalog seed generated from the mock catalog (stable UUIDs)
- [x] Database tests on PGlite: 41 checks covering RLS, constraints and triggers (`npm run test:db`)
- [x] Supabase Auth: sign up, sign in, sign out, email confirmation, password reset
- [x] Persistent library/wishlist, reviews and ratings, diary, lists, favorites, follows, profile edits
- [x] Following review feed and activity feed from the database
- [x] Optimistic updates with rollback on failure; loading and error states
- [x] Migrations applied to the Supabase project; tested end to end in the browser (sign-up, wishlist, status, rating + review, diary, list create/reorder/delete, favorites, feed, reload persistence)
- [x] Removing a game from the library also removes its library feed events
- [x] Fix: fetches that overlap a write are discarded and refetched (deleted items no longer reappear)
- [x] Tested: profile edit, password-reset request, auth-link error handling and open-redirect protection, anonymous tampering blocked
- [x] Production smoke test; unknown game pages return HTTP 404; baseline security headers (no framing, nosniff, referrer policy)
- [ ] Following another user end to end (needs a second account)
- [ ] Avatar uploads (Supabase Storage)
- [ ] Custom SMTP for auth emails (Supabase's built-in email is rate-limited)

## Phase 3 — Real game data ✅ (awaiting review)
- [x] Evaluate providers: IGDB recommended (see docs/GAME_DATA_PROVIDERS.md)
- [x] Twitch developer app "Supabox" (Client ID + Secret, server-only)
- [x] IGDB client (token caching, 4 req/s limit, retries) and mapping to our `games` rows (unit-tested)
- [x] Migration: logo, background art, popularity, trigram title search, listing indexes; fictional games removed
- [x] `npm run catalog:sync`: about 9.5k games (last 12 months, hyped upcoming, all titles with 20+ ratings) in about 1 minute
- [x] Import on demand: any IGDB game becomes available when searched for or opened
- [x] Search API (`/api/games/search`) with a per-IP limit; client game cache; real cover art, logos and backgrounds
- [x] Recently Released and Coming Soon from real release dates
- [x] IGDB attribution in the footer
- [ ] Email partner@igdb.com for the commercial partnership (before launch)
- [x] Daily catalog sync with GitHub Actions (`.github/workflows/catalog-sync.yml`, 06:00 UTC, plus a manual "Run workflow" button)
- [x] Critic scores (IGDB aggregate of outlet reviews) on game pages and covers
- [x] Paginated "New Releases" (last 90 days) and "Coming Soon" (next 12 months) pages, 24 per page, up to 20 pages
- [ ] Filters: genre, platform, release year

## Phase 4 — Social experience
- [ ] Privacy settings (private profiles), blocking, reporting and moderation basics
- [ ] Discover people; follower and following lists

## Phase 5 — Quality and beta
- [ ] Component and e2e tests (Playwright), accessibility audit, performance budget, SEO (sitemaps, OG images)
- [ ] pt-BR translation

## Phase 6 — Launch
- [x] Production deploy on Vercel (approved 2026-11-11) at https://supaboxd.com, with HTTPS and a www redirect
- [x] Brand assets: logo, favicon, app icons, social share image
- [x] Hidden from search engines until launch (`NEXT_PUBLIC_ALLOW_INDEXING`)
- [ ] Custom SMTP for auth emails (Supabase's built-in email sends only a few per hour)
- [ ] Privacy policy and terms (LGPD), cookie notice if needed
- [ ] Rotate the Supabase secret key and the Twitch secret (both were shared in chat)
- [ ] IGDB commercial partnership (partner@igdb.com)
- [ ] Monitoring and error reporting
- [ ] Turn on domain auto-renew at Wix
- [ ] Move to Vercel Pro before any monetization (Hobby is non-commercial)
- [ ] Plan the Expo mobile apps

## Known limitations
- GitHub pauses scheduled workflows in repositories with no commits for 60 days; re-enable it from the Actions tab if that happens.
- Recently Released includes small indie titles; ranking or curation may need tuning.
- The client loads bounded slices of community data (e.g. the 30 newest public lists, 200 reviews per game). Pagination comes with real catalog volumes.
- Community ratings are computed from up to 200 loaded reviews per game; a database aggregate will replace this.
- Search is client-side over the catalog and isn't reflected in the URL.
- Profile and list pages fetch their title from the database for metadata (about 1 s on a cold request); add caching later.
- No full Content-Security-Policy yet (only `frame-ancestors`).
- List and favourite reordering uses buttons, not drag and drop.
- Avatars are generated initials; there are no uploads.
- Featured lists are set by staff in the Supabase dashboard (`lists.featured`); there is no admin UI yet.
