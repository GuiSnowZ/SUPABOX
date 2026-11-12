import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { NewList } from "@/components/lists/lists-views";

export async function generateMetadata({ params }: PageProps<"/[lang]/lists/new">): Promise<Metadata> {
  const { t } = await getT(params);
  return { title: t.lists.newList };
}

export default function NewListPage() {
  return <NewList />;
}
