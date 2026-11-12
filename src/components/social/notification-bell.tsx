"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { useUnreadCount } from "@/features/app/notifications";
import { useAppState } from "@/features/app/store";

/** Header bell with the unread count (signed-in users only). */
export function NotificationBell() {
  const state = useAppState();
  const unread = useUnreadCount(state.currentUserId);
  if (!state.currentUserId) return null;
  return (
    <Link
      href="/notifications"
      aria-label={unread ? `Notifications (${unread} unread)` : "Notifications"}
      className={buttonClasses("ghost", "icon", "relative h-9 w-9")}
    >
      <Bell className="h-4 w-4" />
      {unread ? (
        <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-fg tabular-nums">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
