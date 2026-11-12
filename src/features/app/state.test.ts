import { describe, expect, it } from "vitest";
import { isValidRating, summarizeRatings } from "@/lib/ratings";
import { getReleaseStatus, matchesQuery } from "@/lib/catalog/provider";
import { isReleasedOn } from "@/lib/catalog/rows";
import { games } from "@/data/games";
import {
  getFollowingReviews,
  getRecentRatings,
  getWishlist,
} from "./selectors";
import {
  canViewList,
  createDemoState,
  createList,
  deleteList,
  deleteReview,
  setFavorites,
  setFollowNotify,
  toggleLike,
  setLibraryStatus,
  signOut,
  toggleFollow,
  toggleWishlist,
  updateList,
  upsertReview,
} from "./state";
import { mockGameId } from "@/data/games";
const G01 = mockGameId(1);
const G02 = mockGameId(2);
const G03 = mockGameId(3);
const G04 = mockGameId(4);
const G05 = mockGameId(5);
const G06 = mockGameId(6);
const G08 = mockGameId(8);

const NOW = "2026-11-10T12:00:00Z";

describe("ratings", () => {
  it("accepts only half-star steps between 0.5 and 5", () => {
    expect([0.5, 1, 3.5, 5].every(isValidRating)).toBe(true);
    expect([0, 0.25, 5.5, -1, NaN, "4"].some(isValidRating)).toBe(false);
  });

  it("averages only valid ratings", () => {
    const s = summarizeRatings([{ rating: 4 }, { rating: 5 }, { rating: null }, { rating: 7 }]);
    expect(s.count).toBe(2);
    expect(s.average).toBe(4.5);
    expect(s.distribution[7]).toBe(1); // 4.0
  });
});

describe("catalog", () => {
  it("treats future and TBA dates as upcoming", () => {
    expect(getReleaseStatus({ releaseDate: "2026-11-10" }, "2026-11-10")).toBe("released");
    expect(getReleaseStatus({ releaseDate: "2026-12-01" }, "2026-11-10")).toBe("upcoming");
    expect(getReleaseStatus({ releaseDate: null }, "2026-11-10")).toBe("upcoming");
  });

  it("isReleasedOn matches the release status rule", () => {
    expect(isReleasedOn({ releaseDate: "2026-11-10" }, "2026-11-10")).toBe(true);
    expect(isReleasedOn({ releaseDate: "2026-11-11" }, "2026-11-10")).toBe(false);
    expect(isReleasedOn({ releaseDate: null }, "2026-11-10")).toBe(false);
  });

  it("search ignores case, accents and ampersands", () => {
    const salt = games.find((g) => g.slug === "salt-and-circuit")!;
    expect(matchesQuery(salt, "SALT and circuit")).toBe(true);
    expect(matchesQuery(salt, "cozy")).toBe(true);
    expect(matchesQuery(salt, "horror")).toBe(false);
  });

  it("has unique slugs and ids", () => {
    expect(new Set(games.map((g) => g.slug)).size).toBe(games.length);
    expect(new Set(games.map((g) => g.id)).size).toBe(games.length);
  });
});

describe("wishlist (want_to_play)", () => {
  it("adds and removes a game without duplicates", () => {
    let s = createDemoState();
    const before = getWishlist(s, "u1").length;
    s = toggleWishlist(s, G04, NOW);
    expect(getWishlist(s, "u1").length).toBe(before + 1);
    expect(s.userGames.filter((u) => u.userId === "u1" && u.gameId === G04)).toHaveLength(1);
    s = toggleWishlist(s, G04, NOW);
    expect(getWishlist(s, "u1").length).toBe(before);
  });

  it("does not overwrite another library status", () => {
    const s = createDemoState();
    // g08 is Completed for the demo user
    const after = toggleWishlist(s, G08, NOW);
    expect(after).toBe(s);
  });

  it("requires sign-in", () => {
    expect(() => toggleWishlist(signOut(createDemoState()), G04)).toThrow(/sign in/i);
  });

  it("records one feed event per user/game/type", () => {
    let s = createDemoState();
    s = setLibraryStatus(s, G04, "playing", NOW);
    s = setLibraryStatus(s, G04, "completed", NOW);
    s = setLibraryStatus(s, G04, "playing", NOW);
    const events = s.activities.filter((a) => a.userId === "u1" && a.gameId === G04 && a.type === "started_playing");
    expect(events).toHaveLength(1);
  });
});

describe("reviews", () => {
  it("keeps a single review per user and game and updates it", () => {
    let s = createDemoState();
    s = upsertReview(s, { gameId: G04, rating: 4, body: "Lovely", containsSpoilers: false }, NOW);
    s = upsertReview(s, { gameId: G04, rating: 4.5, body: "", containsSpoilers: true }, "2026-11-11T00:00:00Z");
    const mine = s.reviews.filter((r) => r.userId === "u1" && r.gameId === G04);
    expect(mine).toHaveLength(1);
    expect(mine[0].rating).toBe(4.5);
    expect(mine[0].body).toBeNull();
    expect(mine[0].containsSpoilers).toBe(false); // spoiler flag needs text
    expect(getRecentRatings(s, "u1")[0].gameId).toBe(G04);
  });

  it("rejects invalid ratings and empty reviews", () => {
    const s = createDemoState();
    expect(() => upsertReview(s, { gameId: G04, rating: 4.2, body: "", containsSpoilers: false })).toThrow();
    expect(() => upsertReview(s, { gameId: G04, rating: null, body: "  ", containsSpoilers: false })).toThrow();
  });

  it("only lets owners delete reviews", () => {
    const s = createDemoState();
    expect(() => deleteReview(s, "r06")).toThrow(/own/); // r06 belongs to mika
    expect(deleteReview(s, "r01").reviews.some((r) => r.id === "r01")).toBe(false);
  });

  it("builds the following feed from follows, newest first", () => {
    let s = createDemoState();
    const feed = getFollowingReviews(s, "u1");
    expect(feed.every((r) => ["u2", "u3", "u4"].includes(r.userId))).toBe(true);
    expect(feed.map((r) => r.createdAt)).toEqual([...feed.map((r) => r.createdAt)].sort().reverse());
    s = toggleFollow(s, "u5", NOW);
    expect(getFollowingReviews(s, "u1").some((r) => r.userId === "u5")).toBe(true);
  });
});

describe("lists", () => {
  it("creates, reorders, de-duplicates and deletes", () => {
    let s = createDemoState();
    const created = createList(s, { title: " Best ", description: "", visibility: "public", gameIds: [G01, G02, G01] }, NOW);
    s = created.state;
    let list = s.lists.find((l) => l.id === created.listId)!;
    expect(list.title).toBe("Best");
    expect(list.items.map((i) => i.gameId)).toEqual([G01, G02]);
    s = updateList(s, list.id, { title: "Best", description: "", visibility: "private", gameIds: [G02, G01] }, NOW);
    list = s.lists.find((l) => l.id === created.listId)!;
    expect(list.items.map((i) => [i.gameId, i.position])).toEqual([[G02, 0], [G01, 1]]);
    s = deleteList(s, list.id);
    expect(s.lists.some((l) => l.id === list.id)).toBe(false);
  });

  it("protects other users' lists and private visibility", () => {
    const s = createDemoState();
    const input = { title: "x", description: "", visibility: "public" as const, gameIds: [] };
    expect(() => updateList(s, "l01", input)).toThrow(/own/);
    expect(() => deleteList(s, "l01")).toThrow(/own/);
    const priv = s.lists.find((l) => l.id === "l07")!; // mika's private list
    expect(canViewList(priv, "u1")).toBe(false);
    expect(canViewList(priv, "u2")).toBe(true);
    expect(canViewList(priv, null)).toBe(false);
  });

  it("requires a title", () => {
    expect(() => createList(createDemoState(), { title: "  ", description: "", visibility: "public", gameIds: [] })).toThrow();
  });
});

describe("favorites", () => {
  /** Demo user u1 with the given games completed and rated, and no favorites yet. */
  function withFinished(ids: string[]) {
    let s = createDemoState();
    s = { ...s, favorites: { ...s.favorites, u1: [] } };
    for (const id of ids) {
      s = setLibraryStatus(s, id, "completed", NOW);
      s = upsertReview(s, { gameId: id, rating: 4, body: "", containsSpoilers: false }, NOW);
    }
    return s;
  }

  it("keeps order and allows at most five", () => {
    const s = setFavorites(withFinished([G01, G02, G03, G04, G05, G06]), [G05, G01, G02]);
    expect(s.favorites.u1).toEqual([G05, G01, G02]);
    expect(() => setFavorites(s, [G01, G02, G03, G04, G05, G06])).toThrow(/up to 5/);
  });

  it("only accepts games that are completed and rated", () => {
    let s = withFinished([G01]);
    expect(() => setFavorites(s, [G02])).toThrow(/completed and rated/);
    s = setLibraryStatus(s, G02, "completed", NOW);
    expect(() => setFavorites(s, [G02])).toThrow(/completed and rated/);
    s = upsertReview(s, { gameId: G02, rating: 3.5, body: "", containsSpoilers: false }, NOW);
    expect(setFavorites(s, [G02, G01]).favorites.u1).toEqual([G02, G01]);
  });

  it("keeps favorites saved before the rule when reordering", () => {
    let s = withFinished([G01]);
    s = { ...s, favorites: { ...s.favorites, u1: [G03] } }; // G03 isn't completed/rated
    expect(setFavorites(s, [G01, G03]).favorites.u1).toEqual([G01, G03]);
  });
});

describe("follows", () => {
  it("toggles and blocks self-follow", () => {
    let s = createDemoState();
    s = toggleFollow(s, "u6", NOW);
    expect(s.follows.some((f) => f.followerId === "u1" && f.followingId === "u6")).toBe(true);
    s = toggleFollow(s, "u6", NOW);
    expect(s.follows.some((f) => f.followerId === "u1" && f.followingId === "u6")).toBe(false);
    expect(() => toggleFollow(s, "u1")).toThrow();
  });
});

describe("likes", () => {
  it("toggles a like and keeps the count in step", () => {
    let s = createDemoState();
    const review = s.reviews.find((r) => r.userId !== "u1")!;
    const before = review.likeCount ?? 0;
    s = toggleLike(s, "review", review.id);
    expect(s.liked.reviews).toContain(review.id);
    expect(s.reviews.find((r) => r.id === review.id)!.likeCount).toBe(before + 1);
    s = toggleLike(s, "review", review.id);
    expect(s.liked.reviews).not.toContain(review.id);
    expect(s.reviews.find((r) => r.id === review.id)!.likeCount).toBe(before);
  });
});

describe("per-friend bell", () => {
  it("only applies to people you follow", () => {
    let s = createDemoState();
    const followed = s.follows.find((f) => f.followerId === "u1")!.followingId;
    s = setFollowNotify(s, followed, false);
    expect(s.follows.find((f) => f.followerId === "u1" && f.followingId === followed)!.notify).toBe(false);
    expect(() => setFollowNotify(s, "u1", false)).toThrow(/Follow them first/);
  });
});
