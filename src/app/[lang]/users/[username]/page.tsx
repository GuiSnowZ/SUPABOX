import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { Suspense } from "react";
import { PublicProfile } from "@/components/profiles/profile-view";
import { getPublicSupabase } from "@/lib/supabase/public";
import { shareMetadata } from "@/lib/seo/meta";

export async function generateMetadata({ params }: PageProps<"/[lang]/users/[username]">): Promise<Metadata> {
  const { username } = await params;
  const db = getPublicSupabase();
  if (!db || !/^[a-z0-9_]{3,30}$/i.test(username)) return { title: `@${username}`, robots: { index: false, follow: false } };
  const { data } = await db
    .from("profiles")
    .select("display_name, username, bio")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  const { t, locale } = await getT(params);
  if (!data) return { title: t.profile.userNotFound, robots: { index: false, follow: false } };
  const title = `${data.display_name} (@${data.username})`;
  return {
    title,
    description: data.bio || undefined,
    ...shareMetadata({
      path: `/users/${data.username}`,
      locale,
      title: `${title} · Supabox`,
      description: data.bio,
      image: `/og/user/${data.username}`,
      type: "profile",
    }),
  };
}

export default function UserPage({ params }: PageProps<"/[lang]/users/[username]">) {
  return (
    <Suspense fallback={null}>
      {params.then(({ username }) => (
        <PublicProfile username={username} />
      ))}
    </Suspense>
  );
}
