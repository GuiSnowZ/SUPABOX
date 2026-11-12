import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { WishlistView } from "@/components/games/library-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/library/wishlist">): Promise<Metadata> {
  const { t } = await getT(params);
  return { title: t.library.wishlistTitle };
}

export default function WishlistPage() {
  return <WishlistView />;
}
