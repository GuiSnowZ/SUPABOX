import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { ReviewsView } from "@/components/reviews/reviews-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/reviews">): Promise<Metadata> {
  const { t } = await getT(params);
  return { title: t.reviews.title };
}

export default function ReviewsPage() {
  return <ReviewsView />;
}
