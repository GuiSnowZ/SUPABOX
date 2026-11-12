import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/account/export — downloads everything the signed-in user has stored
 * in Supabox as JSON (LGPD/GDPR data portability). Reads go through RLS with
 * the user's own session, so only their own data (incl. private lists) is included.
 */
export async function GET() {
  const db = await createSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to download your data." }, { status: 401 });

  const own = (table: string, column = "user_id") => db.from(table).select("*").eq(column, user.id);
  const [profile, library, reviews, diary, lists, favorites, following, followers, activity] = await Promise.all([
    db.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    own("user_games"),
    own("reviews"),
    own("play_sessions"),
    db.from("lists").select("*, list_items(game_id, position, added_at)").eq("user_id", user.id),
    own("user_favorite_games"),
    own("follows", "follower_id"),
    own("follows", "following_id"),
    own("activities"),
  ]);
  const failed = [profile, library, reviews, diary, lists, favorites, following, followers, activity].find((r) => r.error);
  if (failed?.error) return NextResponse.json({ error: "Couldn't export your data. Please try again." }, { status: 500 });

  const payload = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email, created_at: user.created_at },
    profile: profile.data,
    library: library.data,
    reviews: reviews.data,
    diary: diary.data,
    lists: lists.data,
    favorite_games: favorites.data,
    following: following.data,
    followers: followers.data,
    activity: activity.data,
    note: "Game ids refer to Supabox's catalog; see https://supaboxd.com/games for details.",
  };
  const name = (profile.data?.username as string | undefined) ?? "account";
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="supabox-${name}-data.json"`,
      "Cache-Control": "no-store",
    },
  });
}
