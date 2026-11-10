import type { Metadata } from "next";
import { MyProfile } from "@/components/profiles/profile-view";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return <MyProfile />;
}
