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

/** Paths that aren't pages (no language): API, auth callbacks, share images, Next internals and files. */
const NOT_A_PAGE = /^\/(api|auth|og|_next)(\/|$)|\.[a-z0-9]+$/i;

/**
 * 1. Language: plain URLs are rewritten to /[lang]/… using the saved choice,
 *    else the browser's language. /pt-BR/… URLs always serve Portuguese (so
 *    search engines can index that version) and /en/… redirects to the plain URL.
 * 2. Unknown game slugs get a real 404 (game pages stream, so they can't set it).
 * 3. Refreshes the Supabase auth session cookie so it doesn't expire while the
 *    user is active. Authorization itself is enforced by Row Level Security.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isPage = !NOT_A_PAGE.test(pathname);

  const prefix = LOCALES.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  const rest = prefix ? pathname.slice(prefix.length + 1) || "/" : pathname;
  const remember = (res: NextResponse, l: Locale) => {
    res.cookies.set(LOCALE_COOKIE, l, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return res;
  };

  // English lives at the plain URLs: /en/… saves the choice and redirects there.
  if (isPage && prefix === "en") {
    return remember(NextResponse.redirect(new URL(`${rest}${search}`, request.url)), "en");
  }

  // /pt-BR/… is served directly (a stable Portuguese URL search engines can index)
  // and remembers the choice; plain URLs use the saved choice or the browser language.
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale: Locale =
    prefix === "pt-BR" ? "pt-BR" : isLocale(saved) ? saved : localeFromAcceptLanguage(request.headers.get("accept-language"));

  const makeResponse = (): NextResponse => {
    if (!isPage) return NextResponse.next({ request });
    const url = new URL(`/${locale}${rest === "/" ? "" : rest}${search}`, request.url);
    const res = NextResponse.rewrite(url, { request });
    return prefix === "pt-BR" && saved !== "pt-BR" ? remember(res, "pt-BR") : res;
  };

  if (isPage && (await unknownGame(rest))) {
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
