import type { Game } from "@/types";

/**
 * Fictional game catalog from the Phase 1 prototype. No longer shown in the app
 * (real games come from IGDB); kept as fixtures for unit tests.
 * Every title, studio and description is invented. Cover art is generated
 * procedurally from the `cover` parameters (no third-party artwork).
 */
type Seed = Omit<Game, "id" | "externalRef" | "coverUrl" | "logoUrl" | "backgroundUrl" | "popularity">;

const seeds: Seed[] = [
  {
    slug: "lanternfall",
    title: "Lanternfall",
    releaseDate: "2026-10-30",
    summary: "Carry the last lantern through a city where the night has weight.",
    description:
      "Lanternfall is a quiet action-adventure about a courier carrying the last working lantern through a drowned city. Light is a resource, a weapon and a way to talk to the people hiding in the dark. Every district you illuminate stays lit — and changes how the city sees you.",
    developer: "Small Hours Studio",
    publisher: "Driftwood Interactive",
    platforms: ["PC", "PlayStation 5", "Xbox Series X|S"],
    genres: ["Action", "Adventure"],
    cover: { from: "#1d2b45", to: "#e8a24a", ink: "#fff3df", motif: "orb" },
  },
  {
    slug: "salt-and-circuit",
    title: "Salt & Circuit",
    releaseDate: "2026-10-16",
    summary: "Repair a seaside robot town one stubborn machine at a time.",
    description:
      "A cozy repair sim set on a salt-crusted coast. Rewire lighthouses, coax old fishing drones back to life and learn why the town's machines stopped trusting people. No timers, no fail states — just tools, tides and a lot of tea.",
    developer: "Tidepool Games",
    publisher: "Tidepool Games",
    platforms: ["PC", "Nintendo Switch 2", "macOS"],
    genres: ["Simulation", "Cozy"],
    cover: { from: "#b9e3dc", to: "#2f7f86", ink: "#0f2b2e", motif: "waves" },
  },
  {
    slug: "hollow-meridian",
    title: "Hollow Meridian",
    releaseDate: "2026-10-02",
    summary: "A survival horror descent into an observatory that shouldn't exist.",
    description:
      "You arrive at Meridian Observatory to collect your sister's research. The building is larger on the inside every time you look away. Hollow Meridian is a slow-burn survival horror game about memory, measurement and the things that hide between stars.",
    developer: "Ninth Bell",
    publisher: "Greyhouse",
    platforms: ["PC", "PlayStation 5"],
    genres: ["Horror", "Survival"],
    cover: { from: "#0c0d10", to: "#4a1f2a", ink: "#e9d6d0", motif: "rings" },
  },
  {
    slug: "kitesong",
    title: "Kitesong",
    releaseDate: "2026-09-18",
    summary: "Glide between floating islands and stitch the sky back together.",
    description:
      "Kitesong is an open-air exploration game played on the wind. Build your kite from what you find, chase thermals across a broken archipelago, and play songs that pull islands back into place. Optional co-op lets a friend fly alongside you.",
    developer: "Paper Lantern Co.",
    publisher: "Paper Lantern Co.",
    platforms: ["PC", "Nintendo Switch 2", "PlayStation 5", "Xbox Series X|S"],
    genres: ["Exploration", "Indie"],
    cover: { from: "#ffd6a5", to: "#7fb7e8", ink: "#20324a", motif: "peaks" },
  },
  {
    slug: "iron-tenants",
    title: "Iron Tenants",
    releaseDate: "2026-08-28",
    summary: "Run a crumbling apartment block for mechs between shifts.",
    description:
      "Part management sim, part tactics game. Your tenants are retired war machines trying to live ordinary lives. Fix the plumbing, settle disputes and — when the developers come to evict everyone — defend the building one floor at a time.",
    developer: "Concrete Garden",
    publisher: "Halfmoon Publishing",
    platforms: ["PC"],
    genres: ["Strategy", "Simulation"],
    cover: { from: "#3a3f44", to: "#d65a31", ink: "#f4efe9", motif: "grid" },
  },
  {
    slug: "velvet-static",
    title: "Velvet Static",
    releaseDate: "2026-08-07",
    summary: "A neo-noir detective story told through a late-night radio show.",
    description:
      "You host a call-in radio show in a city that never quite sleeps. Callers bring confessions, rumors and lies. Piece together a disappearance by choosing who stays on air — and who gets cut off. A narrative adventure with fully voiced callers.",
    developer: "Afterglow Narrative",
    publisher: "Driftwood Interactive",
    platforms: ["PC", "PlayStation 5", "Xbox Series X|S", "macOS"],
    genres: ["Narrative", "Mystery"],
    cover: { from: "#2a1033", to: "#c3417a", ink: "#ffe3f0", motif: "stripes" },
  },
  {
    slug: "rootbound",
    title: "Rootbound",
    releaseDate: "2026-07-10",
    summary: "A roguelite where you grow your deck like a garden.",
    description:
      "In Rootbound, cards are seeds. Plant them, wait, prune and harvest. Each run is a season in a strange forest whose creatures remember how you treated them last time. Deep synergies, short runs, and a soundtrack of field recordings.",
    developer: "Mossline",
    publisher: "Mossline",
    platforms: ["PC", "Nintendo Switch", "Nintendo Switch 2", "iOS", "Android"],
    genres: ["Roguelite", "Card Game", "Indie"],
    cover: { from: "#16301f", to: "#9bc46a", ink: "#effbe2", motif: "shards" },
  },
  {
    slug: "the-long-quiet",
    title: "The Long Quiet",
    releaseDate: "2026-06-12",
    summary: "Two strangers. One rail line. A thousand kilometres of snow.",
    description:
      "A story-driven road trip on rails. Keep an old train running across a frozen continent while getting to know the only other passenger. Conversations are shaped by what you choose to talk about — and what you choose to leave unsaid.",
    developer: "Northwind Collective",
    publisher: "Greyhouse",
    platforms: ["PC", "PlayStation 5", "Xbox Series X|S"],
    genres: ["Narrative", "Adventure"],
    cover: { from: "#dfe7ee", to: "#5d7286", ink: "#18222c", motif: "peaks" },
  },
  {
    slug: "pixel-pilgrims",
    title: "Pixel Pilgrims",
    releaseDate: "2026-05-01",
    summary: "A four-player couch co-op journey across a hand-drawn world.",
    description:
      "Pixel Pilgrims is a cooperative platformer built for the couch. Up to four players share one bundle of supplies on a pilgrimage to the edge of the map. Help each other, argue about routes, and laugh when someone falls off a cliff — again.",
    developer: "Bright Bench",
    publisher: "Halfmoon Publishing",
    platforms: ["Nintendo Switch", "Nintendo Switch 2", "PC"],
    genres: ["Platformer", "Co-op", "Multiplayer"],
    cover: { from: "#ffe066", to: "#f25f5c", ink: "#2b1b17", motif: "grid" },
  },
  {
    slug: "drift-protocol",
    title: "Drift Protocol",
    releaseDate: "2026-03-20",
    summary: "Arcade racing through a city that rebuilds itself every lap.",
    description:
      "An anti-gravity racer where the track is procedurally rewired in real time. Master the drift, ride the shortcuts that only exist for a second, and climb the online leagues. Supports split-screen and cross-play.",
    developer: "Overclock Studios",
    publisher: "Overclock Studios",
    platforms: ["PC", "PlayStation 5", "Xbox Series X|S"],
    genres: ["Racing", "Multiplayer"],
    cover: { from: "#0a1f3c", to: "#3ee8c9", ink: "#e9fffb", motif: "stripes" },
  },
  {
    slug: "ember-and-oath",
    title: "Ember & Oath",
    releaseDate: "2025-11-14",
    summary: "A sprawling fantasy RPG where every promise has a cost.",
    description:
      "Ember & Oath is a party-based RPG about the oaths that bind a kingdom together. Swear them, keep them, or break them — and watch the world remember. Over sixty hours of story with real consequences and a tactical, pausable combat system.",
    developer: "Highcrest",
    publisher: "Greyhouse",
    platforms: ["PC", "PlayStation 5", "Xbox Series X|S"],
    genres: ["RPG", "Fantasy"],
    cover: { from: "#2b0f0e", to: "#e0663a", ink: "#ffe9d6", motif: "orb" },
  },
  {
    slug: "glasshouse",
    title: "Glasshouse",
    releaseDate: "2025-09-05",
    summary: "A puzzle game about light, reflection and an empty greenhouse.",
    description:
      "Rotate panes, split beams and bring an abandoned greenhouse back to life. Glasshouse has no text and no timer — only around 120 handcrafted puzzles and a story told through the plants that bloom as you solve them.",
    developer: "Prism Pocket",
    publisher: "Prism Pocket",
    platforms: ["PC", "macOS", "iOS", "Android", "Nintendo Switch"],
    genres: ["Puzzle", "Indie"],
    cover: { from: "#d7f9f1", to: "#54b6a0", ink: "#0e3a33", motif: "shards" },
  },
  {
    slug: "starfold-tactics",
    title: "Starfold Tactics",
    releaseDate: "2025-06-27",
    summary: "Turn-based squad tactics aboard a fleet folding through space.",
    description:
      "Command a crew aboard a ship that folds space to travel. Each jump scrambles the map — and sometimes your crew. Starfold Tactics blends grid-based combat with a branching campaign and permanent consequences.",
    developer: "Vector Nine",
    publisher: "Halfmoon Publishing",
    platforms: ["PC", "PlayStation 5"],
    genres: ["Strategy", "Sci-Fi"],
    cover: { from: "#0d0b26", to: "#7a5cff", ink: "#ece8ff", motif: "rings" },
  },
  {
    slug: "backyard-legends",
    title: "Backyard Legends",
    releaseDate: "2024-08-09",
    summary: "Summer holidays, a bike, and a neighbourhood full of secrets.",
    description:
      "Relive the endless summer of being eleven. Ride your bike, trade cards, build a fort and uncover the legend of the house at the end of the street. A nostalgic adventure for anyone who remembers when one afternoon felt like forever.",
    developer: "Lemonade Games",
    publisher: "Lemonade Games",
    platforms: ["PC", "Nintendo Switch", "PlayStation 5"],
    genres: ["Adventure", "Indie"],
    cover: { from: "#ffc971", to: "#5fa35a", ink: "#1f2a12", motif: "orb" },
  },
  {
    slug: "deepwater-signal",
    title: "Deepwater Signal",
    releaseDate: "2024-03-15",
    summary: "Answer a distress call from the bottom of the ocean.",
    description:
      "Alone in a research submarine, you follow a signal into the deepest trench on Earth. Deepwater Signal is a tense, atmospheric horror game where your sonar is your only sense and silence is your only defense.",
    developer: "Ninth Bell",
    publisher: "Greyhouse",
    platforms: ["PC", "PlayStation 5", "Xbox Series X|S"],
    genres: ["Horror", "Exploration"],
    cover: { from: "#020b14", to: "#1f6f8b", ink: "#cfeffa", motif: "waves" },
  },
  {
    slug: "crown-of-nine-rivers",
    title: "Crown of Nine Rivers",
    releaseDate: "2023-10-20",
    summary: "An action RPG across a river kingdom on the brink of war.",
    description:
      "Nine rivers, nine rulers, one crown. Fight, negotiate and sail your way across a vast kingdom in this action RPG with fluid combat and a living political system.",
    developer: "Highcrest",
    publisher: "Greyhouse",
    platforms: ["PC", "PlayStation 5", "Xbox Series X|S"],
    genres: ["RPG", "Action"],
    cover: { from: "#10263a", to: "#d9b45b", ink: "#fff6dc", motif: "peaks" },
  },
  {
    slug: "tiny-orbit",
    title: "Tiny Orbit",
    releaseDate: "2022-05-12",
    summary: "Build a solar system small enough to fit in your pocket.",
    description:
      "A relaxing sandbox about gravity. Place planets, nudge moons and watch tiny civilizations rise on the worlds you balance. Tiny Orbit is endlessly replayable and surprisingly emotional.",
    developer: "Prism Pocket",
    publisher: "Prism Pocket",
    platforms: ["PC", "macOS", "iOS", "Android"],
    genres: ["Simulation", "Sandbox", "Indie"],
    cover: { from: "#160c2e", to: "#ff9e6d", ink: "#fff1e8", motif: "rings" },
  },
  {
    slug: "last-arcade-on-earth",
    title: "Last Arcade on Earth",
    releaseDate: "2021-11-03",
    summary: "Keep the world's final arcade open, one high score at a time.",
    description:
      "Part management game, part collection of original micro-arcade games. Repair cabinets, welcome regulars and keep the lights on in the last arcade on Earth. Each cabinet is a fully playable mini-game.",
    developer: "Bright Bench",
    publisher: "Bright Bench",
    platforms: ["PC", "Nintendo Switch", "PlayStation 5"],
    genres: ["Simulation", "Arcade"],
    cover: { from: "#1a0b2e", to: "#ff4d8d", ink: "#ffe6f0", motif: "grid" },
  },
  {
    slug: "harbor-hearts",
    title: "Harbor Hearts",
    releaseDate: "2020-07-24",
    summary: "Run a tiny ferry and connect the lives of an island town.",
    description:
      "Ferry passengers between islands, learn their stories and help them find their way. Harbor Hearts is a short, tender narrative game that many players finish in a single evening — and remember for years.",
    developer: "Tidepool Games",
    publisher: "Tidepool Games",
    platforms: ["PC", "Nintendo Switch", "iOS", "Android"],
    genres: ["Narrative", "Cozy", "Indie"],
    cover: { from: "#ffe5d9", to: "#e07a8a", ink: "#3b1720", motif: "waves" },
  },
  // ——— Upcoming ———
  {
    slug: "afterlight-protocol",
    title: "Afterlight Protocol",
    releaseDate: "2026-12-04",
    summary: "A stealth thriller set during the last night of a dying satellite city.",
    description:
      "Infiltrate an orbital city on the night its lights go out for good. Afterlight Protocol is a systemic stealth game with multiple routes, non-lethal options and a city that reacts to every alarm.",
    developer: "Overclock Studios",
    publisher: "Driftwood Interactive",
    platforms: ["PC", "PlayStation 5", "Xbox Series X|S"],
    genres: ["Stealth", "Action"],
    cover: { from: "#050608", to: "#58c785", ink: "#e5ffef", motif: "stripes" },
  },
  {
    slug: "moonmilk-farm",
    title: "Moonmilk Farm",
    releaseDate: "2027-02-19",
    summary: "Farm under a moon that changes what your crops become.",
    description:
      "A farming life sim where each moon phase transforms your fields. Raise strange livestock, befriend the night market and learn the old lunar calendar.",
    developer: "Mossline",
    publisher: "Halfmoon Publishing",
    platforms: ["PC", "Nintendo Switch 2", "macOS"],
    genres: ["Simulation", "Cozy"],
    cover: { from: "#1b1f3b", to: "#f3e9c6", ink: "#1b1f3b", motif: "orb" },
  },
  {
    slug: "cinder-vault",
    title: "Cinder Vault",
    releaseDate: null,
    summary: "A co-op heist roguelike inside a volcano bank.",
    description:
      "Plan a heist, then watch the plan fall apart. Cinder Vault is a four-player co-op roguelike about robbing a bank built inside an active volcano.",
    developer: "Concrete Garden",
    publisher: "Concrete Garden",
    platforms: ["PC", "PlayStation 5", "Xbox Series X|S"],
    genres: ["Roguelite", "Co-op", "Multiplayer"],
    cover: { from: "#240b05", to: "#ff7a1a", ink: "#fff0e0", motif: "shards" },
  },
];

/** Stable UUID for mock game #n (1-based). Matches the catalog seed migration. */
export function mockGameId(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

export const games: Game[] = seeds.map((g, i) => ({
  ...g,
  id: mockGameId(i + 1),
  coverUrl: null,
  logoUrl: null,
  backgroundUrl: null,
  popularity: 0,
  externalRef: { provider: "mock", id: String(1000 + i) },
}));
