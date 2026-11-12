import type { Metadata } from "next";
import { Suspense } from "react";
import { ReviewDetail } from "@/components/reviews/review-detail";
import { Container, Skeleton } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Review" };

export default function ReviewPage({ params }: PageProps<"/reviews/[id]">) {
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
