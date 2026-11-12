import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { isLocale, type Locale, LOCALE_COOKIE, LOCALES, localeFromAcceptLanguage } from "@/i18n/config";
import { gameMayExist } from "@/lib/catalog/exists";
import { isSupabaseConfigured, SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Game pages stream, so a missing game can't change the HTTP status from inside
 * the page. Unknown slugs are answered with a real 404 here instead.
 */
/** Fixed pages under /games/ that are not game slugs. */
const GAME_SECTION_PAGES = new Set(["new-releases", "coming-soon"]);

async function unknownGame(pathname: string): Promise<boolean> {
  const m = /^\/games\/([^/]+)\/?$/.exec(pathname);
  if (!m || GAME_SECTION_PAGES.has(m[1])) return false;
  let slug: string;
  try {
    slug = decodeURIComponent(m[1]);
  } catch {
    return true;
  }
  return !(await gameMayExist(slug));
}

/** Paths that aren't pages (no language): API, auth callbacks, Next internals and files. */
const NOT_A_PAGE = /^\/(api|auth|_next)(\/|$)|\.[a-z0-9]+$/i;

/**
 * 1. Language: /pt-BR/… or /en/… links save that language and redirect to the
 *    plain URL; every page request is rewritten to /[lang]/… using the saved
 *    choice, else the browser's language.
 * 2. Unknown game slugs get a real 404 (game pages stream, so they can't set it).
 * 3. Refreshes the Supabase auth session cookie so it doesn't expire while the
 *    user is active. Authorization itself is enforced by Row Level Security.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isPage = !NOT_A_PAGE.test(pathname);

  const prefix = LOCALES.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (isPage && prefix) {
    const url = new URL(`${pathname.slice(prefix.length + 1) || "/"}${search}`, request.url);
    const res = NextResponse.redirect(url);
    res.cookies.set(LOCALE_COOKIE, prefix, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return res;
  }

  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(saved) ? saved : localeFromAcceptLanguage(request.headers.get("accept-language"));

  const makeResponse = (): NextResponse => {
    if (!isPage) return NextResponse.next({ request });
    const url = new URL(`/${locale}${pathname === "/" ? "" : pathname}${search}`, request.url);
    return NextResponse.rewrite(url, { request });
  };

  if (isPage && (await unknownGame(pathname))) {
    return NextResponse.rewrite(new URL(`/${locale}/__not-found`, request.url), { status: 404 });
  }
  let response = makeResponse();
  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = makeResponse();
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
