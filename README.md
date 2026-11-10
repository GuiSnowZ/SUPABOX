# Supabox

**Your games. Your story.** A social diary for video games. Track what you play, rate and review games, build lists and see what your friends are playing.

> **Status: Phase 2 — accounts and persistent data.** Sign-up, sign-in, libraries, wishlists, reviews, diary, lists, favorites and follows are saved in Supabase (PostgreSQL with Row Level Security). The game catalog is still a fictional placeholder until Phase 3.

## Run it locally

Requirements: Node.js 20.9 or later (developed on Node 24 LTS), npm and a Supabase project.

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in your project's URL and **publishable** key (Supabase → Settings → API Keys). Never use the secret/service-role key in the app.
3. Set up the database once: in Supabase → **SQL Editor**, run the files in `supabase/migrations/` in order (or use the Supabase CLI: `supabase db push`).
4. Supabase → **Authentication → URL Configuration**: Site URL `http://localhost:3000`, and add `http://localhost:3000/**` to Redirect URLs.
5. `npm run dev` and open <http://localhost:3000>.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run typecheck` | Generate route types and run `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npm run test:db` | Applies the migrations to an in-memory Postgres (PGlite) and checks constraints, triggers and RLS |
| `npm run db:seed-sql` | Regenerates the catalog seed migration from `src/data/games.ts` |
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

## Docs

- [Product requirements](docs/PRODUCT_REQUIREMENTS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Decisions](docs/DECISIONS.md)
- Database schema: [`supabase/migrations/`](supabase/migrations/), tests in [`supabase/tests/`](supabase/tests/)
