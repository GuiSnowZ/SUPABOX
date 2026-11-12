/**
 * Build the official Supabox lists from IGDB data.
 *
 *   npm run lists:build
 *
 * Every list is defined below by explicit criteria (genres, themes, game modes,
 * companies, community keywords, play time…) and ranked with the same weighted
 * score, so nothing is hand-ranked or invented. The criteria text is stored with
 * each list and shown on its page. Lists that can't be derived from data
 * (e.g. "Most Influential") are created unpublished until a person curates them.
 *
 * Needs IGDB_CLIENT_ID, IGDB_CLIENT_SECRET and SUPABASE_SECRET_KEY. Safe to re-run.
 */
import { createClient } from "@supabase/supabase-js";
import { IgdbClient } from "../src/lib/igdb/client.ts";
import { fetchGameRows, type GameRow } from "../src/lib/igdb/map.ts";
import {
  type Candidate,
  type ListItem,
  pickBestPerGroup,
  rankByScore,
  RATING_PRIOR,
  type ListCategory,
} from "../src/lib/official-lists/ranking.ts";

try {
  process.loadEnvFile(new URL("../.env.local", import.meta.url));
} catch {
  // Environment may come from the shell instead.
}
const need = (name: string) => {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing ${name}`);
    process.exit(1);
  }
  return v;
};

const igdb = new IgdbClient({ clientId: need("IGDB_CLIENT_ID"), clientSecret: need("IGDB_CLIENT_SECRET") });
const db = createClient(need("NEXT_PUBLIC_SUPABASE_URL"), need("SUPABASE_SECRET_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});

const NOW = Math.floor(Date.now() / 1000);
const YEAR = new Date().getUTCFullYear();
const ts = (y: number) => Math.floor(Date.UTC(y, 0, 1) / 1000);
// Main games and remakes only: remasters, special editions, DLCs, bundles and ports
// would duplicate the original in a ranking.
const BASE = "game_type = (0,8) & version_parent = null & cover != null & first_release_date != null";
const CAND_FIELDS = "id,name,slug,first_release_date,total_rating,total_rating_count,hypes,franchises.name";

/** Up to `max` candidates matching `where`, most-rated first. */
async function candidates(where: string, max = 1000, sort = "total_rating_count desc"): Promise<Candidate[]> {
  const out: Candidate[] = [];
  for (let offset = 0; offset < max; offset += 500) {
    const page = await igdb.query<Candidate>(
      "games",
      `fields ${CAND_FIELDS}; where ${BASE} & ${where}; sort ${sort}; limit ${Math.min(500, max - offset)}; offset ${offset};`,
    );
    out.push(...page);
    if (page.length < 500) break;
  }
  return out;
}

const rated = (minCount: number) => `total_rating != null & total_rating_count >= ${minCount}`;

/** Company ids whose name starts with any prefix (studios included), minus excluded names. */
async function companyIds(prefixes: string[], exclude: RegExp | null = null, extra: number[] = []): Promise<number[]> {
  const ids = new Set(extra);
  for (const p of prefixes) {
    const rows = await igdb.query<{ id: number; name: string }>(
      "companies",
      `fields id,name; where name ~ "${p}"*; limit 200;`,
    );
    for (const r of rows) if (!exclude || !exclude.test(r.name)) ids.add(r.id);
  }
  return [...ids];
}
const byCompanies = (ids: number[]) => `involved_companies.company = (${ids.join(",")})`;

// ——— List definitions ———

interface ListDef {
  slug: string;
  title: string;
  description: string;
  category: ListCategory;
  criteria: string;
  /** Editorial lists without a data source stay unpublished until curated. */
  editorial?: boolean;
  build?: () => Promise<ListItem[]>;
}

/** Match game names loosely (case, apostrophes and punctuation ignored). */
const nameKey = (name = "") => name.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Top `n` games matching `where`. `exclude` names games the IGDB tags put in the
 * wrong list (reviewed by hand; the criteria text says so). A name excludes
 * every version of that game (original and remake).
 */
const top = (n: number, min: number, where: string, pool = 1000, exclude: string[] = []) => async () =>
  rankByScore((await candidates(`${rated(min)} & ${where}`, pool)).filter((c) => !exclude.map(nameKey).includes(nameKey(c.name))))
    .slice(0, n)
    .map((c) => ({ igdbId: c.id }));
const REVIEWED = " Games mis-tagged on IGDB are removed by the Supabox team.";

const SCORE_NOTE = `Ranked by IGDB rating (critics and players) weighted by the number of ratings, so a game needs both quality and reach (Bayesian average, prior ${RATING_PRIOR.mean} over ${RATING_PRIOR.weight} ratings).`;

const GENERATIONS: Array<{ name: string; platforms: number[]; from: number; to: number }> = [
  { name: "3rd generation (NES era)", platforms: [18, 64], from: 1983, to: 1992 },
  { name: "4th generation (SNES & Genesis)", platforms: [19, 29, 86], from: 1987, to: 1997 },
  { name: "5th generation (PlayStation & N64)", platforms: [7, 4, 32], from: 1994, to: 2002 },
  { name: "6th generation (PS2, GameCube, Xbox)", platforms: [8, 21, 11, 23], from: 1998, to: 2008 },
  { name: "7th generation (PS3, Xbox 360, Wii)", platforms: [9, 12, 5], from: 2005, to: 2014 },
  { name: "8th generation (PS4, Xbox One, Switch)", platforms: [48, 49, 41, 130], from: 2013, to: 2021 },
  { name: "9th generation (PS5, Xbox Series, Switch 2)", platforms: [167, 169, 508], from: 2020, to: YEAR },
];

async function buildDefs(): Promise<ListDef[]> {
  const nintendo = await companyIds(["Nintendo"]);
  const sony = await companyIds(["Sony Computer Entertainment", "Sony Interactive Entertainment", "SIE "], null, [10100]);
  const microsoft = [53, 128, 1010, 17966, 81488];
  const rockstar = await companyIds(["Rockstar"]);
  const ubisoft = await companyIds(["Ubisoft"]);
  const capcom = await companyIds(["Capcom", "CAPCOM"]);
  const squareEnix = await companyIds(["Square Enix", "Square Product", "Square USA", "Enix"], null, [53031]);
  const fromSoftware = [1012];

  const company = (slug: string, name: string, ids: number[], blurb: string): ListDef => ({
    slug,
    title: `Best ${name} Games`,
    description: blurb,
    category: "companies",
    criteria: `Games developed or published by ${name} or its studios, with at least 20 ratings. ${SCORE_NOTE}`,
    build: top(20, 20, byCompanies(ids), 500),
  });

  return [
    // Classics and rankings
    {
      slug: "100-greatest-games-of-all-time",
      title: "100 Greatest Games of All Time",
      description: "The games critics and players rate highest, across every era and platform.",
      category: "rankings",
      criteria: `Every game with at least 300 ratings on IGDB. ${SCORE_NOTE}`,
      build: async () => rankByScore(await candidates(rated(300), 2500)).slice(0, 100).map((c) => ({ igdbId: c.id })),
    },
    {
      slug: "best-games-of-each-decade",
      title: "Best Games of Each Decade",
      description: "The ten standouts of every decade, from the arcade years to today.",
      category: "rankings",
      criteria: `Games first released in each decade with at least 40 ratings; top 10 per decade. ${SCORE_NOTE}`,
      build: async () => {
        const items: ListItem[] = [];
        // Newest decade first.
        for (let d = Math.floor(YEAR / 10) * 10; d >= 1980; d -= 10) {
          const pool = await candidates(`${rated(40)} & first_release_date >= ${ts(d)} & first_release_date < ${ts(d + 10)}`, 1000);
          for (const c of rankByScore(pool).slice(0, 10)) items.push({ igdbId: c.id, section: `${d}s` });
        }
        return items;
      },
    },
    {
      slug: "most-iconic-video-game-franchises",
      title: "Most Iconic Video Game Franchises",
      description: "The series with the biggest, best-loved catalogues — each shown through its best-rated game.",
      category: "rankings",
      criteria:
        "Franchises ranked by the total number of IGDB ratings across their games (100+ ratings each); each is represented by its highest-scoring game.",
      build: async () => {
        const pool = (await candidates(rated(100), 3000)).filter((c) => c.franchises?.length);
        return pickBestPerGroup(pool, (c) => c.franchises?.[0]?.name ?? null, 25).map(({ game, group }) => ({
          igdbId: game.id,
          note: group,
        }));
      },
    },
    {
      slug: "most-popular-games-of-each-year",
      title: "Most Popular Games of Each Year",
      description: "The five most-played-and-rated games released in every year since 1995.",
      category: "rankings",
      criteria: "For each release year, the five games with the most ratings on IGDB (a measure of how many people played them).",
      build: async () => {
        const items: ListItem[] = [];
        for (let y = YEAR - 1; y >= 1995; y--) {
          const pool = await candidates(`total_rating_count > 0 & first_release_date >= ${ts(y)} & first_release_date < ${ts(y + 1)}`, 5);
          for (const c of pool) items.push({ igdbId: c.id, section: String(y) });
        }
        return items;
      },
    },
    {
      slug: "best-games-of-each-console-generation",
      title: "Best Games of Each Console Generation",
      description: "From the NES to the PS5: the ten best games released during each console generation.",
      category: "rankings",
      criteria: `Games on each generation's consoles, first released during that generation, with at least 30 ratings; top 10 each. ${SCORE_NOTE}`,
      build: async () => {
        const items: ListItem[] = [];
        for (const g of [...GENERATIONS].reverse()) {
          const pool = await candidates(
            `${rated(30)} & platforms = (${g.platforms.join(",")}) & first_release_date >= ${ts(g.from)} & first_release_date < ${ts(g.to + 1)}`,
            1000,
          );
          for (const c of rankByScore(pool).slice(0, 10)) items.push({ igdbId: c.id, section: g.name });
        }
        return items;
      },
    },

    // Companies and platforms
    {
      slug: "best-nintendo-games",
      title: "Best Nintendo Games",
      description: "Nintendo's finest, from its own studios and published titles.",
      category: "platforms",
      criteria: `Games developed or published by Nintendo or its studios, with at least 30 ratings. ${SCORE_NOTE}`,
      build: top(25, 30, byCompanies(nintendo), 800),
    },
    {
      slug: "best-playstation-games",
      title: "Best PlayStation Games",
      description: "The best of Sony's first-party catalogue.",
      category: "platforms",
      criteria: `Games developed or published by Sony Interactive Entertainment (formerly Sony Computer Entertainment) and its studios, with at least 30 ratings. ${SCORE_NOTE}`,
      build: top(25, 30, byCompanies(sony), 800),
    },
    {
      slug: "best-xbox-games",
      title: "Best Xbox Games",
      description: "The best of Microsoft's first-party catalogue.",
      category: "platforms",
      criteria: `Games developed or published by Xbox Game Studios / Microsoft Studios, with at least 30 ratings. ${SCORE_NOTE}`,
      build: top(25, 30, byCompanies(microsoft), 800),
    },
    {
      slug: "best-pc-games",
      title: "Best PC Games",
      description: "The highest-rated games you can play on PC.",
      category: "platforms",
      criteria: `Games available on PC (Windows) with at least 200 ratings. ${SCORE_NOTE}`,
      build: top(25, 200, "platforms = (6)", 2000),
    },
    company("best-rockstar-games", "Rockstar", rockstar, "Open worlds and crime epics from Rockstar's studios."),
    company("best-ubisoft-games", "Ubisoft", ubisoft, "Assassin's Creed, Rayman, Far Cry and more from Ubisoft's studios."),
    company("best-capcom-games", "Capcom", capcom, "Resident Evil, Monster Hunter, Street Fighter and the rest of Capcom's best."),
    company("best-fromsoftware-games", "FromSoftware", fromSoftware, "Souls, Sekiro, Elden Ring and FromSoftware's earlier classics."),
    company("best-square-enix-games", "Square Enix", squareEnix, "Final Fantasy, Dragon Quest, Kingdom Hearts — including the Square and Enix years."),

    // Genres and categories
    {
      slug: "best-rpgs-of-all-time",
      title: "Best RPGs of All Time",
      description: "Role-playing games worth sinking a hundred hours into.",
      category: "genres",
      criteria: `Role-playing games on IGDB, excluding games that are mainly shooters, hack-and-slash, platformers, strategy or simulation games with RPG elements. At least 50 ratings.${REVIEWED} ${SCORE_NOTE}`,
      build: top(25, 50, "genres = (12) & genres != (5,25,8,15,16,13)", 1000, ["Dishonored", "Dishonored 2"]),
    },
    {
      slug: "best-horror-games",
      title: "Best Horror Games",
      description: "Play these with the lights on.",
      category: "genres",
      criteria: `Horror games tagged "survival horror" or "psychological horror" on IGDB — action games that merely have horror elements (hack-and-slash, platformers, fantasy action RPGs) are left out. At least 30 ratings. ${SCORE_NOTE}`,
      build: top(25, 30, "themes = (19) & keywords = (1836,131) & genres != (12,25,8) & themes != (17)"),
    },
    {
      slug: "best-open-world-games",
      title: "Best Open World Games",
      description: "Huge worlds you can lose yourself in.",
      category: "genres",
      criteria: `Games from 2001 on with the IGDB "Open world" theme that are either RPGs/adventures or also tagged "Sandbox"/"open-world" (platformers and racing games excluded), at least 60 ratings. Games IGDB mis-tags as open world (linear or hub-based games) are removed by the Supabox team. ${SCORE_NOTE}`,
      build: async () => {
        const since = `first_release_date >= ${ts(2001)}`;
        const pools = await Promise.all([
          candidates(`${rated(60)} & themes = (38) & genres = (12,31) & genres != (8,10,9) & ${since}`, 1500),
          candidates(`${rated(60)} & themes = (38) & (themes = (33) | keywords = (54851,57478,51930)) & genres != (8,10) & ${since}`, 1500),
        ]);
        const notOpenWorld = new Set(
          [
            "Star Wars: Knights of the Old Republic",
            "Star Wars: Knights of the Old Republic II - The Sith Lords",
            "Bloodborne",
            "Batman: Arkham Asylum",
            "Persona 4",
            "Demon's Souls",
            "Dragon Age: Origins",
            "The Legend of Zelda: A Link Between Worlds",
          ].map(nameKey),
        );
        const unique = [...new Map(pools.flat().map((c) => [c.id, c])).values()].filter((c) => !notOpenWorld.has(nameKey(c.name)));
        return rankByScore(unique).slice(0, 25).map((c) => ({ igdbId: c.id }));
      },
    },
    {
      slug: "best-story-driven-games",
      title: "Best Story-Driven Games",
      description: "Games remembered for their stories and characters.",
      category: "genres",
      criteria: `Adventure games, visual novels and RPGs tagged "story rich", "narrative" or "choices matter" by the IGDB community, excluding action games. At least 40 ratings. ${SCORE_NOTE}`,
      build: top(25, 40, "keywords = (2426,17268,3534) & genres = (31,34,12) & themes != (1)"),
    },
    {
      slug: "best-indie-games",
      title: "Best Indie Games",
      description: "Small teams, huge games.",
      category: "genres",
      criteria: `IGDB genre "Indie", at least 40 ratings. ${SCORE_NOTE}`,
      build: top(25, 40, "genres = (32)"),
    },
    {
      slug: "best-multiplayer-games",
      title: "Best Multiplayer Games",
      description: "The best games to play with — or against — other people.",
      category: "genres",
      criteria: `Games built to be played with other people: IGDB "Multiplayer" or "MMO" mode and no single-player mode. At least 150 ratings.${REVIEWED} ${SCORE_NOTE}`,
      build: top(25, 150, "game_modes = (2,5) & game_modes != (1)", 1500, ["Tony Hawk's Pro Skater 3", "TagPro"]),
    },
    {
      slug: "best-co-op-games",
      title: "Best Co-op Games",
      description: "Team up and finish it together.",
      category: "genres",
      criteria: `Games with a co-op campaign that are made for co-op: either tagged "couch co-op"/"local co-op" or with no single-player mode (MMOs excluded). At least 30 ratings. ${SCORE_NOTE}`,
      build: top(25, 30, "multiplayer_modes.campaigncoop = true & game_modes != (5) & (keywords = (1634,1635) | game_modes != (1))"),
    },
    {
      slug: "best-soulslike-games",
      title: "Best Soulslike Games",
      description: "Tough, fair and unforgettable.",
      category: "genres",
      criteria: `Games tagged "soulslike" by the IGDB community (turn-based games excluded), at least 20 ratings. ${SCORE_NOTE}`,
      build: top(25, 20, "keywords = (17326,58746) & genres != (16)"),
    },

    // Special collections
    {
      slug: "hidden-gems",
      title: "Hidden Gems",
      description: "Brilliant games that flew under most people's radar.",
      category: "special",
      criteria:
        "Games that both critics (4+ reviews) and players (10+ ratings) score 80 or higher on IGDB, but that fewer than 120 people have rated. Released at least a year ago; sports series excluded. Ranked by overall rating.",
      build: async () =>
        (
          await candidates(
            `aggregated_rating >= 80 & aggregated_rating_count >= 4 & rating >= 80 & rating_count >= 10 & total_rating_count <= 120 & genres != (14) & first_release_date < ${NOW - 365 * 86_400}`,
            500,
            "total_rating desc",
          )
        )
          .slice(0, 25)
          .map((c) => ({ igdbId: c.id })),
    },
    {
      slug: "games-everyone-should-play-once",
      title: "Games Everyone Should Play Once",
      description: "Essential experiences, whatever kind of player you are.",
      category: "special",
      criteria: "Curated by the Supabox team.",
      editorial: true,
    },
    {
      slug: "best-games-under-10-hours",
      title: "Best Games Under 10 Hours",
      description: "Great games you can finish in a weekend.",
      category: "special",
      criteria: `Games whose typical completion time on IGDB ("normally", from player submissions) is under 10 hours, with at least 50 ratings. ${SCORE_NOTE}`,
      build: async () => {
        const short = new Set<number>();
        for (let offset = 0; offset < 6000; offset += 500) {
          const page = await igdb.query<{ game_id: number }>(
            "game_time_to_beats",
            `fields game_id; where normally != null & normally <= 36000 & count >= 3; sort count desc; limit 500; offset ${offset};`,
          );
          page.forEach((t) => short.add(t.game_id));
          if (page.length < 500) break;
        }
        const ids = [...short];
        const pool: Candidate[] = [];
        for (let i = 0; i < ids.length; i += 400) {
          pool.push(...(await candidates(`${rated(50)} & id = (${ids.slice(i, i + 400).join(",")})`, 400)));
        }
        return rankByScore(pool).slice(0, 25).map((c) => ({ igdbId: c.id }));
      },
    },
    {
      slug: "most-influential-games-in-history",
      title: "Most Influential Games in History",
      description: "The games that changed what games could be.",
      category: "special",
      criteria: "Curated by the Supabox team.",
      editorial: true,
    },
    {
      slug: "best-games-to-play-with-friends",
      title: "Best Games to Play With Friends",
      description: "Couch co-op, split screen and party games for game night.",
      category: "special",
      criteria: `Party, fighting, racing, sports, trivia, board and platform games with the IGDB "Party" theme, split-screen play or "couch co-op"/"local co-op" tags. At least 30 ratings.${REVIEWED} ${SCORE_NOTE}`,
      build: top(25, 30, "(themes = (40) | keywords = (1634,1635) | multiplayer_modes.splitscreen = true) & genres = (4,10,14,26,35,8,33)", 1000, [
        "Uncharted 3: Drake's Deception",
        "Beat Saber",
      ]),
    },
    {
      slug: "best-video-game-soundtracks",
      title: "Best Video Game Soundtracks",
      description: "Games whose music stays with you.",
      category: "special",
      criteria: `Games tagged "great soundtrack" by the IGDB community, at least 30 ratings. ${SCORE_NOTE}`,
      build: top(25, 30, "keywords = (3403)"),
    },
    {
      slug: "most-anticipated-upcoming-games",
      title: "Most Anticipated Upcoming Games",
      description: "What everyone is waiting for. Updated every day.",
      category: "special",
      criteria: "Unreleased games ranked by IGDB hype (people following the game). Refreshed daily.",
      build: async () =>
        (await igdb.query<Candidate>(
          "games",
          `fields ${CAND_FIELDS}; where game_type = (0,8) & version_parent = null & cover != null & (first_release_date > ${NOW} | first_release_date = null) & hypes > 0; sort hypes desc; limit 25;`,
        )).map((c) => ({ igdbId: c.id })),
    },
  ];
}

// ——— Saving ———

async function saveGames(rows: GameRow[]) {
  const unique = [...new Map(rows.map((r) => [r.provider_id, r])).values()];
  const { error } = await db.from("games").upsert(unique, { onConflict: "provider,provider_id" });
  if (!error) return;
  if (error.code !== "23505") throw new Error(error.message);
  for (const row of unique) {
    let res = await db.from("games").upsert(row, { onConflict: "provider,provider_id" });
    if (res.error?.code === "23505") {
      res = await db.from("games").upsert({ ...row, slug: `${row.slug}--igdb-${row.provider_id}` }, { onConflict: "provider,provider_id" });
    }
    if (res.error) console.warn(`  skipped ${row.title}: ${res.error.message}`);
  }
}

/** Make sure every IGDB game is in our catalog; returns IGDB id → our uuid. */
async function ensureGames(igdbIds: number[]): Promise<Map<number, string>> {
  const ids = [...new Set(igdbIds)];
  for (let i = 0; i < ids.length; i += 400) {
    await saveGames(await fetchGameRows(igdb, `id = (${ids.slice(i, i + 400).join(",")})`, { limit: 500 }));
  }
  const map = new Map<number, string>();
  for (let i = 0; i < ids.length; i += 300) {
    const { data, error } = await db
      .from("games")
      .select("id, provider_id")
      .eq("provider", "igdb")
      .in("provider_id", ids.slice(i, i + 300).map(String));
    if (error) throw new Error(error.message);
    for (const r of data ?? []) map.set(Number(r.provider_id), r.id);
  }
  return map;
}

const started = Date.now();
const defs = await buildDefs();
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const order: Record<ListCategory, number> = { rankings: 0, platforms: 1, companies: 2, genres: 3, special: 4 };

for (const [i, def] of defs.entries()) {
  if (only && def.slug !== only) continue;
  const items = def.build ? await def.build() : [];
  const ids = await ensureGames(items.map((it) => it.igdbId));
  const resolved = items.filter((it) => ids.has(it.igdbId));
  const published = !def.editorial && resolved.length > 0;

  const { data: list, error } = await db
    .from("official_lists")
    .upsert(
      {
        slug: def.slug,
        title: def.title,
        description: def.description,
        category: def.category,
        position: order[def.category] * 100 + i,
        criteria: def.criteria,
        published,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();
  if (error) throw new Error(`${def.slug}: ${error.message}`);
  // Editorial lists keep whatever a curator put in them.
  if (!def.editorial) {
    const del = await db.from("official_list_items").delete().eq("list_id", list.id);
    if (del.error) throw new Error(del.error.message);
    if (resolved.length) {
      const ins = await db.from("official_list_items").insert(
        resolved.map((it, position) => ({
          list_id: list.id,
          position,
          game_id: ids.get(it.igdbId),
          section: it.section ?? null,
          note: it.note ?? null,
        })),
      );
      if (ins.error) throw new Error(`${def.slug}: ${ins.error.message}`);
    }
  }
  console.log(`${published ? "✓" : "·"} ${def.title}: ${def.editorial ? "editorial (unpublished)" : `${resolved.length} games`}`);
}
console.log(`Done in ${Math.round((Date.now() - started) / 1000)}s.`);
