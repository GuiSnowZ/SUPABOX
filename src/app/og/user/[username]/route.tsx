import { getDictionary } from "@/i18n";
import { SUPABASE_URL } from "@/lib/supabase/config";
import { createPublicSupabase } from "@/lib/supabase/public";
import { ogImage } from "@/lib/seo/og-card";
import { ogLocale } from "@/lib/seo/og-lang";

export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const locale = ogLocale(request);
  const t = getDictionary(locale);
  const db = createPublicSupabase();
  const username = (await params).username.toLowerCase();
  if (!db || !/^[a-z0-9_]{3,30}$/.test(username)) return new Response("Not found", { status: 404 });
  const { data: p } = await db
    .from("profiles")
    .select("id, username, display_name, bio, avatar_hue, avatar_path")
    .eq("username", username)
    .maybeSingle();
  if (!p) return new Response("Not found", { status: 404 });
  const [completed, reviews] = await Promise.all([
    db.from("user_games").select("game_id", { count: "exact", head: true }).eq("user_id", p.id).eq("status", "completed"),
    db.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", p.id),
  ]);
  const initials = String(p.display_name)
    .split(/\s+/)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? "")
    .join("");
  const avatar = p.avatar_path ? (
    // eslint-disable-next-line @next/next/no-img-element -- rendered by Satori
    <img
      src={`${SUPABASE_URL}/storage/v1/object/public/avatars/${p.avatar_path}`}
      alt=""
      width={320}
      height={320}
      style={{ borderRadius: 9999, objectFit: "cover" }}
    />
  ) : (
    <div
      style={{
        display: "flex",
        width: 320,
        height: 320,
        borderRadius: 9999,
        alignItems: "center",
        justifyContent: "center",
        fontSize: 130,
        fontWeight: 700,
        color: `hsl(${p.avatar_hue} 70% 92%)`,
        background: `linear-gradient(135deg, hsl(${p.avatar_hue} 45% 42%), hsl(${(p.avatar_hue + 40) % 360} 50% 26%))`,
      }}
    >
      {initials}
    </div>
  );
  return ogImage({
    art: avatar,
    kicker: t.og.profile,
    title: p.display_name,
    lines: [`@${p.username}`, t.og.profileStats(completed.count ?? 0, reviews.count ?? 0)],
  });
}
