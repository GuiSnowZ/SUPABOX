"use client";

import { BookMarked, Library, LogIn, LogOut, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { NotificationBell } from "@/components/social/notification-bell";
import { Avatar } from "@/components/ui/avatar";
import { useCurrentUser } from "@/features/app/hooks";
import { signOut } from "@/features/app/auth";
import { useAppState } from "@/features/app/store";
import { toast } from "@/features/app/ui-store";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { isActive, PRIMARY_NAV } from "./nav-config";

function DesktopNavLinks({ pathname }: { pathname: string | null }) {
  return (
    <ul className="hidden items-center gap-1 md:flex">
      {PRIMARY_NAV.map((item) => {
        const active = isActive(item, pathname);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-16 items-center gap-2 px-3 text-sm font-medium transition-colors",
                active ? "text-fg" : "text-muted hover:text-fg",
              )}
            >
              <Icon className={cn("h-4 w-4", active && "text-accent")} />
              {item.label}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent transition-opacity",
                  active ? "opacity-100" : "opacity-0",
                )}
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ActiveDesktopNav() {
  return <DesktopNavLinks pathname={usePathname()} />;
}

function UserMenu() {
  const user = useCurrentUser();
  const { authReady, currentUserId } = useAppState();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!authReady || (currentUserId && !user)) {
    return <span aria-hidden className="animate-skeleton h-8 w-8 rounded-full bg-surface" />;
  }

  if (!user) {
    return (
      <Link href="/sign-in" className={buttonClasses("primary", "sm")}>
        <LogIn className="h-4 w-4" />
        Sign in
      </Link>
    );
  }

  const item = "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted hover:bg-surface hover:text-fg";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className="flex items-center rounded-full p-0.5 transition hover:ring-2 hover:ring-border-strong"
      >
        <Avatar profile={user} size="sm" />
      </button>
      {open ? (
        <div
          role="menu"
          className="animate-fade-in absolute right-0 mt-2 w-56 rounded-xl border border-border bg-bg-subtle p-1.5 shadow-xl shadow-black/40"
        >
          <div className="px-2.5 pt-1.5 pb-2">
            <p className="truncate text-sm font-medium text-fg">{user.displayName}</p>
            <p className="truncate text-xs text-faint">@{user.username}</p>
          </div>
          <div className="my-1 h-px bg-border" />
          <Link role="menuitem" href="/profile" className={item} onClick={() => setOpen(false)}>
            <User className="h-4 w-4" /> Profile
          </Link>
          <Link role="menuitem" href="/library" className={item} onClick={() => setOpen(false)}>
            <Library className="h-4 w-4" /> Library
          </Link>
          <Link role="menuitem" href="/library/wishlist" className={item} onClick={() => setOpen(false)}>
            <BookMarked className="h-4 w-4" /> Wishlist
          </Link>
          <div className="my-1 h-px bg-border" />
          <button
            role="menuitem"
            type="button"
            className={item}
            onClick={async () => {
              setOpen(false);
              await signOut();
              toast("Signed out");
              router.push("/");
              router.refresh();
            }}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-bg/85 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/70">
      <nav aria-label="Main" className="mx-auto flex h-14 max-w-[var(--container-page)] items-center gap-6 px-4 sm:px-6 md:h-16 lg:px-8">
        <Logo />
        <Suspense fallback={<DesktopNavLinks pathname={null} />}>
          <ActiveDesktopNav />
        </Suspense>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/games#search"
            aria-label="Search games"
            className={buttonClasses("ghost", "icon", "h-9 w-9")}
          >
            <Search className="h-4 w-4" />
          </Link>
          <NotificationBell />
          <Link href="/library" className={buttonClasses("ghost", "sm", "max-lg:hidden")}>
            <Library className="h-4 w-4" />
            Library
          </Link>
          <UserMenu />
        </div>
      </nav>
    </header>
  );
}
