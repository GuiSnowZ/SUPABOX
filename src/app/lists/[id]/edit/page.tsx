import type { Metadata } from "next";
import { Suspense } from "react";
import { EditList } from "@/components/lists/lists-views";

export const metadata: Metadata = { title: "Edit list" };

export default function EditListPage({ params }: PageProps<"/lists/[id]/edit">) {
  return <Suspense fallback={null}>{params.then(({ id }) => <EditList id={id} />)}</Suspense>;
}
