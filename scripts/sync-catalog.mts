/**
 * Sync the Supabox catalog from IGDB into the `games` table.
 *
 *   npm run catalog:sync            # full base catalog (~8–9k games, a few minutes)
 *   npm run catalog:sync -- --quick # one page per set, for testing
 *
 * Needs IGDB_CLIENT_ID, IGDB_CLIENT_SECRET and SUPABASE_SECRET_KEY in .env.local.
 * Safe to re-run: rows are upserted by (provider, provider_id).
 */
import { createClient } from "@supabase/supabase-js";
import { IgdbClient } from "../src/lib/igdb/client.ts";
import { fetchGameRows, type GameRow, PLAYABLE_GAME_TYPES } from "../src/lib/igdb/map.ts";

try {
  process.loadEnvFile(new URL("../.env.local", import.meta.url));
} catch {
  // Environment may come from the shell instead.
}

const need = (name: string) => {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing ${name} in .env.local`);
    process.exit(1);
  }
  return v;
};

const quick = process.argv.includes("--quick");
const igdb = new IgdbClient({ clientId: need("IGDB_CLIENT_ID"), clientSecret: need("IGDB_CLIENT_SECRET") });
const db = createClient(need("NEXT_PUBLIC_SUPABASE_URL"), need("SUPABASE_SECRET_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});

const now = Math.floor(Date.now() / 1000);
const DAY = 86_400;
const base = `game_type = ${PLAYABLE_GAME_TYPES} & cover != null`;

const sets: Array<{ name: string; where: string; sort: string; maxPages: number }> = [
  {
    name: "Recently released (last 12 months)",
    where: `${base} & first_release_date >= ${now - 365 * DAY} & first_release_date <= ${now} & (total_rating_count > 0 | hypes > 0)`,
    sort: "first_release_date desc",
    maxPages: 8,
  },
  {
    name: "Upcoming (next 18 months)",
    where: `${base} & first_release_date > ${now} & first_release_date < ${now + 540 * DAY} & hypes > 2`,
    sort: "hypes desc",
    maxPages: 4,
  },
  {
    name: "Popular (20+ ratings)",
    where: `${base} & total_rating_count > 20`,
    sort: "total_rating_count desc",
    maxPages: 20,
  },
];

async function save(rows: GameRow[]): Promise<number> {
  if (!rows.length) return 0;
  const unique = [...new Map(rows.map((r) => [r.provider_id, r])).values()];
  const { error } = await db.from("games").upsert(unique, { onConflict: "provider,provider_id" });
  if (!error) return unique.length;
  if (error.code !== "23505") throw new Error(error.message);
  // A slug clash inside the batch: save one by one, de-duplicating clashing slugs.
  let n = 0;
  for (const row of unique) {
    let res = await db.from("games").upsert(row, { onConflict: "provider,provider_id" });
    if (res.error?.code === "23505") {
      res = await db
        .from("games")
        .upsert({ ...row, slug: `${row.slug}--igdb-${row.provider_id}` }, { onConflict: "provider,provider_id" });
    }
    if (res.error) console.warn(`  skipped ${row.title}: ${res.error.message}`);
    else n++;
  }
  return n;
}

const started = Date.now();
let total = 0;
for (const set of sets) {
  let setTotal = 0;
  const pages = quick ? 1 : set.maxPages;
  for (let page = 0; page < pages; page++) {
    const rows = await fetchGameRows(igdb, set.where, { sort: set.sort, limit: 500, offset: page * 500 });
    setTotal += await save(rows);
    process.stdout.write(`\r${set.name}: ${setTotal} games`);
    if (rows.length < 500) break;
  }
  process.stdout.write("\n");
  total += setTotal;
}

const { count } = await db.from("games").select("id", { count: "exact", head: true });
console.log(`Done in ${Math.round((Date.now() - started) / 1000)}s — ${total} rows written, ${count ?? "?"} games in the catalog.`);
