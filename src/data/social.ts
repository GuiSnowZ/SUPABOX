import type {
  Activity,
  Follow,
  GameList,
  ID,
  PlaySession,
  Profile,
  Review,
  UserGame,
} from "@/types";
import { mockGameId } from "@/data/games";
const G01 = mockGameId(1);
const G02 = mockGameId(2);
const G03 = mockGameId(3);
const G04 = mockGameId(4);
const G05 = mockGameId(5);
const G06 = mockGameId(6);
const G07 = mockGameId(7);
const G08 = mockGameId(8);
const G09 = mockGameId(9);
const G10 = mockGameId(10);
const G11 = mockGameId(11);
const G12 = mockGameId(12);
const G13 = mockGameId(13);
const G14 = mockGameId(14);
const G15 = mockGameId(15);
const G16 = mockGameId(16);
const G17 = mockGameId(17);
const G18 = mockGameId(18);
const G19 = mockGameId(19);
const G20 = mockGameId(20);
const G22 = mockGameId(22);

/**
 * Fictional community for the Phase 1 prototype.
 * Game IDs refer to src/data/games.ts (g01 Lanternfall … g22 Cinder Vault).
 */

/** The demo account you are "signed in" as in the prototype. */
export const DEMO_USER_ID: ID = "u1";

export const profiles: Profile[] = [
  {
    id: "u1",
    username: "ren",
    displayName: "Ren Okafor",
    bio: "Story games, cozy sims and the occasional horror binge. Slowly clearing a backlog that only grows.",
    avatarHue: 150,
    joinedAt: "2025-02-11",
  },
  {
    id: "u2",
    username: "mika",
    displayName: "Mika Laine",
    bio: "Horror connoisseur. If it has a flashlight and a creaky door, I've played it.",
    avatarHue: 340,
    joinedAt: "2025-01-03",
  },
  {
    id: "u3",
    username: "theo",
    displayName: "Theo Brandão",
    bio: "RPGs, tactics, spreadsheets. Joga comigo em português também.",
    avatarHue: 210,
    joinedAt: "2025-03-22",
  },
  {
    id: "u4",
    username: "sol",
    displayName: "Sol Arriaga",
    bio: "Indie hunter. Small studios, big feelings.",
    avatarHue: 40,
    joinedAt: "2025-05-09",
  },
  {
    id: "u5",
    username: "juno",
    displayName: "Juno Park",
    bio: "Couch co-op evangelist. Racing games on weekends.",
    avatarHue: 270,
    joinedAt: "2025-06-30",
  },
  {
    id: "u6",
    username: "ash",
    displayName: "Ash Whitlow",
    bio: "Completionist. 100% or it didn't happen.",
    avatarHue: 10,
    joinedAt: "2025-08-14",
  },
];

/** The demo user follows mika, theo and sol (not juno or ash). */
export const follows: Follow[] = [
  { followerId: "u1", followingId: "u2", createdAt: "2025-03-01T10:00:00Z" },
  { followerId: "u1", followingId: "u3", createdAt: "2025-04-02T10:00:00Z" },
  { followerId: "u1", followingId: "u4", createdAt: "2025-06-12T10:00:00Z" },
  { followerId: "u2", followingId: "u1", createdAt: "2025-03-05T10:00:00Z" },
  { followerId: "u3", followingId: "u1", createdAt: "2025-04-10T10:00:00Z" },
  { followerId: "u5", followingId: "u1", createdAt: "2025-07-01T10:00:00Z" },
  { followerId: "u2", followingId: "u4", createdAt: "2025-05-20T10:00:00Z" },
  { followerId: "u4", followingId: "u2", createdAt: "2025-05-21T10:00:00Z" },
  { followerId: "u3", followingId: "u6", createdAt: "2025-09-01T10:00:00Z" },
  { followerId: "u6", followingId: "u3", createdAt: "2025-09-02T10:00:00Z" },
  { followerId: "u5", followingId: "u4", createdAt: "2025-08-01T10:00:00Z" },
];

const ug = (userId: ID, gameId: ID, status: UserGame["status"], addedAt: string): UserGame => ({
  userId,
  gameId,
  status,
  addedAt,
  updatedAt: addedAt,
});

export const userGames: UserGame[] = [
  // Ren (demo user)
  ug("u1", G01, "playing", "2026-11-01T19:00:00Z"),
  ug("u1", G08, "completed", "2026-06-20T21:00:00Z"),
  ug("u1", G19, "completed", "2025-03-01T20:00:00Z"),
  ug("u1", G12, "completed", "2025-10-10T20:00:00Z"),
  ug("u1", G15, "completed", "2025-05-02T20:00:00Z"),
  ug("u1", G11, "dropped", "2025-12-20T20:00:00Z"),
  ug("u1", G02, "want_to_play", "2026-10-17T12:00:00Z"),
  ug("u1", G03, "want_to_play", "2026-10-05T12:00:00Z"),
  ug("u1", G07, "want_to_play", "2026-07-15T12:00:00Z"),
  ug("u1", G20, "want_to_play", "2026-09-01T12:00:00Z"),
  ug("u1", G14, "completed", "2025-08-01T12:00:00Z"),
  ug("u1", G17, "playing", "2026-09-20T12:00:00Z"),
  // Others
  ug("u2", G03, "completed", "2026-10-12T22:00:00Z"),
  ug("u2", G15, "completed", "2024-04-01T22:00:00Z"),
  ug("u2", G01, "playing", "2026-11-02T22:00:00Z"),
  ug("u3", G11, "completed", "2026-01-30T22:00:00Z"),
  ug("u3", G13, "completed", "2025-08-10T22:00:00Z"),
  ug("u3", G05, "playing", "2026-09-02T22:00:00Z"),
  ug("u4", G07, "completed", "2026-08-01T22:00:00Z"),
  ug("u4", G04, "completed", "2026-10-01T22:00:00Z"),
  ug("u4", G02, "playing", "2026-10-20T22:00:00Z"),
  ug("u5", G09, "completed", "2026-05-20T22:00:00Z"),
  ug("u5", G10, "playing", "2026-04-02T22:00:00Z"),
  ug("u6", G16, "completed", "2024-02-10T22:00:00Z"),
  ug("u6", G13, "completed", "2025-07-30T22:00:00Z"),
];

const rv = (
  id: string,
  userId: ID,
  gameId: ID,
  rating: number | null,
  body: string | null,
  at: string,
  containsSpoilers = false,
): Review => ({ id, userId, gameId, rating, body, containsSpoilers, createdAt: at, updatedAt: at });

export const reviews: Review[] = [
  rv("r01", "u1", G08, 4.5, "Quietly devastating. The train becomes a character of its own, and the final conversation stayed with me for days. Best writing I've played this year.", "2026-06-22T20:00:00Z"),
  rv("r02", "u1", G19, 5, "A single evening that I still think about. Every passenger's story is tiny and perfect.", "2025-03-02T20:00:00Z"),
  rv("r03", "u1", G12, 4, null, "2025-10-11T20:00:00Z"),
  rv("r04", "u1", G15, 3.5, "Incredible sound design, a little too long in the middle act. The sonar mechanic is genius.", "2025-05-03T20:00:00Z"),
  rv("r05", "u1", G14, 4, null, "2025-08-03T20:00:00Z"),
  rv("r06", "u2", G03, 4.5, "The observatory map rearranging itself is the scariest thing I've experienced in a game since Deepwater Signal. Play it with headphones, lights off.", "2026-10-13T23:00:00Z"),
  rv("r07", "u2", G15, 5, "Still the benchmark for underwater horror. The moment the sonar goes silent…", "2024-04-03T23:00:00Z"),
  rv("r08", "u2", G01, 4, "Only a few hours in, but the lighting system is gorgeous and the city feels genuinely lonely.", "2026-11-05T21:00:00Z"),
  rv("r09", "u3", G11, 4.5, "Sixty hours and every oath mattered. The late-game betrayal is earned. Tactical combat could use more enemy variety.", "2026-02-01T22:00:00Z", false),
  rv("r10", "u3", G13, 4, "When the fold scrambled my best sniper onto the enemy side I screamed. Brilliant design.", "2025-08-11T22:00:00Z", true),
  rv("r11", "u3", G05, 3.5, "Charming premise and the tenant stories are lovely, but the defense missions repeat too soon.", "2026-10-28T22:00:00Z"),
  rv("r12", "u4", G07, 5, "The deck-as-garden idea is so good I'm annoyed nobody did it before. Perfect short runs.", "2026-08-02T22:00:00Z"),
  rv("r13", "u4", G04, 4.5, "Pure joy. Catching a thermal and gliding over the whole archipelago is the best feeling in games this year.", "2026-10-03T22:00:00Z"),
  rv("r14", "u4", G02, 4, "Ridiculously calming. I fixed a lighthouse and nearly cried.", "2026-10-25T22:00:00Z"),
  rv("r15", "u5", G09, 4.5, "Our group's new Friday night tradition. Chaos in the best way.", "2026-05-22T22:00:00Z"),
  rv("r16", "u5", G10, 3.5, "Track rewiring is wild. Online leagues need better matchmaking.", "2026-04-10T22:00:00Z"),
  rv("r17", "u6", G16, 4, "Platinumed it. The river battles are unforgettable.", "2024-02-12T22:00:00Z"),
  rv("r18", "u6", G13, 3, null, "2025-07-31T22:00:00Z"),
];

export const playSessions: PlaySession[] = [
  { id: "p01", userId: "u1", gameId: G01, kind: "first_playthrough", startedOn: "2026-11-01", finishedOn: null, note: "Finally starting this.", createdAt: "2026-11-01T19:00:00Z" },
  { id: "p02", userId: "u1", gameId: G08, kind: "first_playthrough", startedOn: "2026-06-13", finishedOn: "2026-06-20", note: "", createdAt: "2026-06-13T19:00:00Z" },
  { id: "p03", userId: "u1", gameId: G19, kind: "first_playthrough", startedOn: "2023-02-14", finishedOn: "2023-02-14", note: "One sitting.", createdAt: "2023-02-14T19:00:00Z" },
  { id: "p04", userId: "u1", gameId: G19, kind: "replay", startedOn: "2025-03-01", finishedOn: "2025-03-01", note: "Replayed with a friend watching. Still perfect.", createdAt: "2025-03-01T19:00:00Z" },
  { id: "p05", userId: "u1", gameId: G17, kind: "returned", startedOn: "2026-09-20", finishedOn: null, note: "Back for the new update.", createdAt: "2026-09-20T19:00:00Z" },
  { id: "p06", userId: "u1", gameId: G12, kind: "first_playthrough", startedOn: "2025-09-28", finishedOn: "2025-10-10", note: "", createdAt: "2025-09-28T19:00:00Z" },
  { id: "p07", userId: "u1", gameId: G15, kind: "first_playthrough", startedOn: "2025-04-20", finishedOn: "2025-05-02", note: "", createdAt: "2025-04-20T19:00:00Z" },
  { id: "p08", userId: "u1", gameId: G14, kind: "first_playthrough", startedOn: "2025-07-20", finishedOn: "2025-08-01", note: "", createdAt: "2025-07-20T19:00:00Z" },
];

const li = (gameIds: ID[], addedAt: string) =>
  gameIds.map((gameId, position) => ({ gameId, position, addedAt }));

export const lists: GameList[] = [
  {
    id: "l01",
    userId: "u2",
    title: "Best Horror Games",
    description: "Lights off, headphones on. My all-time favorite scares, ranked.",
    visibility: "public",
    featured: true,
    items: li([G15, G03, G01], "2026-10-14T10:00:00Z"),
    createdAt: "2026-10-14T10:00:00Z",
    updatedAt: "2026-10-14T10:00:00Z",
  },
  {
    id: "l02",
    userId: "u4",
    title: "Hidden Gems",
    description: "Small games from small teams that deserve way more love.",
    visibility: "public",
    featured: true,
    items: li([G07, G12, G19, G17, G02], "2026-10-26T10:00:00Z"),
    createdAt: "2026-10-26T10:00:00Z",
    updatedAt: "2026-10-26T10:00:00Z",
  },
  {
    id: "l03",
    userId: "u1",
    title: "Games That Made Me Cry",
    description: "No shame. These got me.",
    visibility: "public",
    featured: true,
    items: li([G19, G08, G14, G02], "2026-07-01T10:00:00Z"),
    createdAt: "2026-07-01T10:00:00Z",
    updatedAt: "2026-07-01T10:00:00Z",
  },
  {
    id: "l04",
    userId: "u5",
    title: "Best Multiplayer Games",
    description: "For game nights, couch sessions and friendships tested.",
    visibility: "public",
    featured: false,
    items: li([G09, G10, G22, G04], "2026-11-03T10:00:00Z"),
    createdAt: "2026-11-03T10:00:00Z",
    updatedAt: "2026-11-03T10:00:00Z",
  },
  {
    id: "l05",
    userId: "u3",
    title: "Best Story-Driven Games",
    description: "RPGs and narrative games where the writing carries everything.",
    visibility: "public",
    featured: false,
    items: li([G11, G08, G06, G16, G13], "2026-11-07T10:00:00Z"),
    createdAt: "2026-11-07T10:00:00Z",
    updatedAt: "2026-11-07T10:00:00Z",
  },
  {
    id: "l06",
    userId: "u1",
    title: "Next up on my backlog",
    description: "Private planning list.",
    visibility: "private",
    featured: false,
    items: li([G03, G07, G02], "2026-10-20T10:00:00Z"),
    createdAt: "2026-10-20T10:00:00Z",
    updatedAt: "2026-10-20T10:00:00Z",
  },
  {
    id: "l07",
    userId: "u2",
    title: "Secret drafts",
    description: "Not ready yet.",
    visibility: "private",
    featured: false,
    items: li([G18], "2026-09-20T10:00:00Z"),
    createdAt: "2026-09-20T10:00:00Z",
    updatedAt: "2026-09-20T10:00:00Z",
  },
];

/** Ordered favorite games per user (max 5). */
export const favoriteGames: Record<ID, ID[]> = {
  u1: [G19, G08, G12, G14],
  u2: [G15, G03, G01],
  u3: [G11, G13, G16],
  u4: [G07, G04, G12, G19, G17],
  u5: [G09, G10],
  u6: [G16],
};

export const activities: Activity[] = [
  { id: "a01", userId: "u2", type: "published_review", gameId: G01, reviewId: "r08", createdAt: "2026-11-05T21:00:00Z" },
  { id: "a02", userId: "u2", type: "started_playing", gameId: G01, createdAt: "2026-11-02T22:00:00Z" },
  { id: "a03", userId: "u3", type: "published_review", gameId: G05, reviewId: "r11", createdAt: "2026-10-28T22:00:00Z" },
  { id: "a04", userId: "u4", type: "published_review", gameId: G02, reviewId: "r14", createdAt: "2026-10-25T22:00:00Z" },
  { id: "a05", userId: "u4", type: "started_playing", gameId: G02, createdAt: "2026-10-20T22:00:00Z" },
  { id: "a06", userId: "u2", type: "completed", gameId: G03, createdAt: "2026-10-12T22:00:00Z" },
  { id: "a07", userId: "u4", type: "completed", gameId: G04, createdAt: "2026-10-01T22:00:00Z" },
  { id: "a08", userId: "u5", type: "added_to_library", gameId: G22, createdAt: "2026-09-28T22:00:00Z" },
  { id: "a09", userId: "u3", type: "started_playing", gameId: G05, createdAt: "2026-09-02T22:00:00Z" },
  { id: "a10", userId: "u1", type: "started_playing", gameId: G01, createdAt: "2026-11-01T19:00:00Z" },
];
