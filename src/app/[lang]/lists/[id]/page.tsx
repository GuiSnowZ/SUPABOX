import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { Suspense } from "react";
import { ListDetail } from "@/components/lists/lists-views";
import { Container, Skeleton } from "@/components/ui/primitives";
import { getPublicSupabase } from "@/lib/supabase/public";
import { shareMetadata } from "@/lib/seo/meta";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: PageProps<"/[lang]/lists/[id]">): Promise<Metadata> {
  const { id } = await params;
  const db = getPublicSupabase();
  const { t, locale } = await getT(params);
  if (!db || !UUID.test(id)) return { title: t.lists.title };
  // Anonymous query: private lists are never visible here, so their titles don't leak.
  const { data } = await db.from("lists").select("title, description").eq("id", id).maybeSingle();
  if (!data) return { title: t.lists.title };
  return {
    title: data.title,
    description: data.description || undefined,
    ...shareMetadata({
      path: `/lists/${id}`,
      locale,
      title: `${data.title} · Supabox`,
      description: data.description,
      image: `/og/community-list/${id}`,
    }),
  };
}

export default function ListPage({ params }: PageProps<"/[lang]/lists/[id]">) {
  return (
    <Suspense
      fallback={
        <Container className="pt-10">
          <Skeleton className="h-8 w-72" />
        </Container>
      }
    >
      {params.then(({ id }) => (
        <ListDetail id={id} />
      ))}
    </Suspense>
  );
}
