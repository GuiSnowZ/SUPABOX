import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { games } from "@/data/games";
import { isSupabaseConfigured, SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Game pages stream, so a missing game can't change the HTTP status from inside
 * the page. Unknown slugs are answered with a real 404 here instead.
 * (Phase 3: replace with a lookup against the catalog provider / games table.)
 */
const KNOWN_GAME_SLUGS = new Set(games.map((g) => g.slug));

function unknownGame(pathname: string): boolean {
  const m = /^\/games\/([^/]+)\/?$/.exec(pathname);
  return Boolean(m && !KNOWN_GAME_SLUGS.has(decodeURIComponent(m[1])));
}

/**
 * Refreshes the Supabase auth session cookie on each navigation so it doesn't
 * expire while the user is active. Authorization itself is enforced by
 * Row Level Security in the database, not here.
 */
export async function proxy(request: NextRequest) {
  if (unknownGame(request.nextUrl.pathname)) {
    return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
  }
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
