import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { Suspense } from "react";
import { PublicProfile } from "@/components/profiles/profile-view";
import { getPublicSupabase } from "@/lib/supabase/public";

export async function generateMetadata({ params }: PageProps<"/[lang]/users/[username]">): Promise<Metadata> {
  const { username } = await params;
  const db = getPublicSupabase();
  if (!db || !/^[a-z0-9_]{3,30}$/i.test(username)) return { title: `@${username}` };
  const { data } = await db
    .from("profiles")
    .select("display_name, username, bio")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  return data
    ? { title: `${data.display_name} (@${data.username})`, description: data.bio || undefined }
    : { title: (await getT(params)).t.profile.userNotFound };
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
