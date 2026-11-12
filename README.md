# Supabox

**Your games. Your story.** A social diary for video games. Live (private beta): **https://supaboxd.com**. Track what you play, rate and review games, build lists and see what your friends are playing.

> **Status: Phase 3 — real game catalog.** Accounts and all user data are saved in Supabase (PostgreSQL with Row Level Security). Game data, covers and logos come from [IGDB](https://www.igdb.com): about 9.5k games are synced, and any other game is imported on demand.

## Run it locally

Requirements: Node.js 20.9 or later (developed on Node 24 LTS), npm and a Supabase project.

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Supabase → Settings → API Keys)
   - `SUPABASE_SECRET_KEY`: **server only**, used for catalog writes
   - `IGDB_CLIENT_ID` and `IGDB_CLIENT_SECRET` from a Twitch developer app (dev.twitch.tv/console)
3. Set up the database once: in Supabase → **SQL Editor**, run the files in `supabase/migrations/` in order (or use the Supabase CLI: `supabase db push`).
4. Supabase → **Authentication → URL Configuration**: Site URL `http://localhost:3000`, and add `http://localhost:3000/**` to Redirect URLs.
5. Load the game catalog: `npm run catalog:sync` (about 1 minute).
6. `npm run dev` and open <http://localhost:3000>.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run typecheck` | Generate route types and run `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npm run test:db` | Applies the migrations to an in-memory Postgres (PGlite) and checks constraints, triggers and RLS |
| `npm run catalog:sync` | Imports and refreshes games from IGDB (`-- --quick` for one page per set). Also runs daily on GitHub Actions. |
| `npm run check` | All of the above, in order |

## Main routes

| Route | Page |
| --- | --- |
| `/` | Home: feed, new releases, reviews |
| `/games`, `/games/[slug]` | Discover games (Recently Released, Coming Soon, search); game details |
| `/lists`, `/lists/new`, `/lists/[id]`, `/lists/[id]/edit` | Community lists |
| `/reviews` | My Reviews / Following |
| `/profile`, `/profile/edit`, `/users/[username]` | Profiles |
| `/library`, `/library/wishlist` | Personal library and wishlist |
| `/sign-in`, `/sign-up`, `/forgot-password`, `/account/password` | Authentication |
| `/auth/confirm` | Handles links from auth emails |

## Deployment

- **Hosting:** Vercel project `supabox` (Hobby plan), connected to this GitHub repository. Every push to `main` deploys to production automatically.
- **Domain:** `supaboxd.com` (registered at Wix; its DNS has an A record pointing to Vercel at `216.198.79.1`). `www.supaboxd.com` permanently redirects to it. Vercel issues the HTTPS certificates.
- **Environment variables:** set in Vercel → Project → Settings → Environment Variables (the same names as `.env.example`). Set `NEXT_PUBLIC_ALLOW_INDEXING=true` and redeploy to let search engines index the site.
- **Supabase Auth:** Site URL `https://supaboxd.com`. Allowed redirect URLs: localhost, supaboxd.com and the Vercel address.
- **Catalog refresh:** GitHub Actions runs it daily (`.github/workflows/catalog-sync.yml`).

## Docs

- [Product requirements](docs/PRODUCT_REQUIREMENTS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Decisions](docs/DECISIONS.md)
- [Game data providers](docs/GAME_DATA_PROVIDERS.md)
- Database schema: [`supabase/migrations/`](supabase/migrations/), tests in [`supabase/tests/`](supabase/tests/)
