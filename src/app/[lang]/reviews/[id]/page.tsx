import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { Suspense } from "react";
import { ReviewDetail } from "@/components/reviews/review-detail";
import { Container, Skeleton } from "@/components/ui/primitives";
import { shareMetadata } from "@/lib/seo/meta";
import { getPublicSupabase } from "@/lib/supabase/public";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: PageProps<"/[lang]/reviews/[id]">): Promise<Metadata> {
  const { t, locale } = await getT(params);
  const { id } = await params;
  const db = getPublicSupabase();
  if (!db || !UUID.test(id)) return { title: t.reviews.pageTitle, robots: { index: false, follow: false } };
  const { data } = await db
    .from("reviews")
    .select("body, contains_spoilers, profiles!reviews_user_id_fkey(display_name), games(title)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return { title: t.reviews.pageTitle, robots: { index: false, follow: false } };
  const game = (data.games as unknown as { title: string } | null)?.title ?? "";
  const author = (data.profiles as unknown as { display_name: string } | null)?.display_name ?? "";
  const title = `${game} — ${t.og.reviewBy(author)}`;
  const description = data.contains_spoilers ? undefined : (data.body as string | null) ?? undefined;
  return {
    title,
    description: description?.slice(0, 160),
    ...shareMetadata({ path: `/reviews/${id}`, locale, title, description, image: `/og/review/${id}`, type: "article" }),
  };
}

export default function ReviewPage({ params }: PageProps<"/[lang]/reviews/[id]">) {
  return (
    <Suspense
      fallback={
        <Container className="max-w-3xl pt-10">
          <Skeleton className="h-40 w-full" />
        </Container>
      }
    >
      {params.then(({ id }) => (
        <ReviewDetail id={id} />
      ))}
    </Suspense>
  );
}
