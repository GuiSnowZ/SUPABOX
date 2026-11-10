# Game data providers — research (2026-11-10)

Goal: replace the 22 fictional games with a real, licensed catalog that includes cover art and logos, for a commercial product.

> This is a technical summary, not legal advice. Before launch, confirm the terms in writing with the provider.

## Recommendation: IGDB (owned by Twitch)

Checked against the official docs at api-docs.igdb.com on 2026-11-10:

| Question | IGDB's answer |
| --- | --- |
| Price | "The API is free for both non-commercial and commercial projects." |
| Commercial use | Allowed through a **commercial partnership**. Email partner@igdb.com. Non-commercial use falls under the Twitch Developer Service Agreement. |
| Attribution | Required for partners: "user facing attribution to IGDB.com", visible and in a static location such as the footer or an about page. |
| Storing / caching data | Allowed and preferred: "we prefer if you store and serve the data to your end users." |
| After a partnership ends | "You are allowed to keep all data you retrieve." |
| Rate limits | 4 requests per second, up to 8 open requests at once, and at most 500 items per request. |
| Access | Twitch account with 2FA, then register an app to get a Client ID and Client Secret, then OAuth client-credentials token (valid 60 days). |
| Browser access | Not supported (no CORS). It must be called from our server, because the secret must never reach the browser. |
| Images | Covers, logos (`/logos`), screenshots and artworks on `images.igdb.com/igdb/image/upload/t_{size}/{image_id}.jpg`, for example `cover_big` (264×374), `logo_med` (284×160) and `1080p`. |
| Extras for partners | Daily CSV data dumps of every endpoint, useful for loading the whole catalog at once. |

It fits Supabox because:
- It covers PC, console and mobile.
- It has release dates per platform, which we need for "Recently Released".
- It covers games and editions.
- Its terms explicitly allow storing the data in our own `games` table, which is exactly what our architecture does.

**Cover art and logos** are the copyright of each game's publisher. IGDB serves them through its image CDN for display. Showing box art to identify a game is common industry practice (it's what Letterboxd does with film posters through TMDB), but we should confirm image usage as part of the IGDB partnership agreement.

## Alternatives considered

| Provider | Summary | Why not first choice |
| --- | --- | --- |
| **RAWG** | Large database; free tier needs attribution plus a link on every page. Commercial limits vary by source (20k requests per month, or about 100k MAU); larger use needs a deal with api@rawg.io. Has a "no clone" clause. | Commercial terms unclear, and the site was down (Cloudflare 522) when we checked. |
| **MobyGames** | Excellent historical data. The API is now paid: commercial use starts at the Bronze tier, $99.99 per month at 1 request/s. | Costly for an early product. Worth revisiting for historical data. |
| **Wikidata** | CC0 (public-domain) metadata: titles, dates, developers, platforms. | No cover art. Useful later as a free secondary source to fill gaps. |
| Steam store data | PC only. Steam's terms don't grant reuse of store data as a catalog. | Not licensed for this use. |

## Integration plan (Phase 3)

1. You create a Twitch developer app with 2FA enabled and get a **Client ID** and **Client Secret**.
   - Store them in `.env.local` as `IGDB_CLIENT_ID` and `IGDB_CLIENT_SECRET`. These are server-only and never `NEXT_PUBLIC_`.
2. Email **partner@igdb.com** for the commercial agreement before public launch.
3. Add `IgdbCatalogProvider`, which implements our existing `CatalogProvider` interface and runs server-side only.
4. Add a sync job that upserts IGDB games into `games` (keyed by `provider='igdb'` and `provider_id`):
   - recent and upcoming releases first, then popular games, then the full catalog (data dumps if we become partners);
   - store the `cover` and `logo` image IDs.
   It writes with the Supabase **secret key**, which stays on the server only.
5. Search queries our own `games` table first. On a miss, it queries IGDB server-side and caches the result.
6. Serve covers with `next/image` from `images.igdb.com`, and add the IGDB attribution to the footer.
7. Retire the mock catalog: migrate any user data from the mock UUIDs (or reset it, since there are no real users yet).
