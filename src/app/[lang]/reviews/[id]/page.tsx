import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { Suspense } from "react";
import { ReviewDetail } from "@/components/reviews/review-detail";
import { Container, Skeleton } from "@/components/ui/primitives";

export async function generateMetadata({ params }: PageProps<"/[lang]/reviews/[id]">): Promise<Metadata> {
  const { t } = await getT(params);
  return { title: t.reviews.pageTitle };
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
