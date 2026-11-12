import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { Suspense } from "react";
import { EditList } from "@/components/lists/lists-views";

export async function generateMetadata({ params }: PageProps<"/[lang]/lists/[id]/edit">): Promise<Metadata> {
  const { t } = await getT(params);
  return { title: t.lists.editTitle };
}

export default function EditListPage({ params }: PageProps<"/[lang]/lists/[id]/edit">) {
  return <Suspense fallback={null}>{params.then(({ id }) => <EditList id={id} />)}</Suspense>;
}
