import type { Metadata } from "next";
import { NewList } from "@/components/lists/lists-views";

export const metadata: Metadata = { title: "New list" };

export default function NewListPage() {
  return <NewList />;
}
