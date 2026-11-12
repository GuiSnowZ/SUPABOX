import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { LibraryView } from "@/components/games/library-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/library">): Promise<Metadata> {
  const { t } = await getT(params);
  return { title: t.library.pageTitle };
}

export default function LibraryPage() {
  return <LibraryView />;
}
