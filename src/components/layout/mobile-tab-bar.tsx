"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, Suspense } from "react";
import { QuickAddButton } from "@/components/games/quick-add";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";
import { isActive, MOBILE_NAV } from "./nav-config";

function Tabs({ pathname }: { pathname: string | null }) {
  const t = useT();
  return (
    <ul className="grid grid-cols-5">
      {MOBILE_NAV.map((item, i) => {
        const active = isActive(item, pathname);
        const Icon = item.icon;
        return (
          <Fragment key={item.href}>
            {i === Math.floor(MOBILE_NAV.length / 2) ? (
              <li>
                <QuickAddButton variant="tab" />
              </li>
            ) : null}
            <li>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active ? "text-accent" : "text-muted active:text-fg",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                {t.nav[item.label]}
              </Link>
            </li>
          </Fragment>
        );
      })}
    </ul>
  );
}

function ActiveTabs() {
  return <Tabs pathname={usePathname()} />;
}

/** Bottom tab bar for small screens: Home, Games, Lists and Profile around the quick-add "+" in the centre. */
export function MobileTabBar() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <Suspense fallback={<Tabs pathname={null} />}>
        <ActiveTabs />
      </Suspense>
    </nav>
  );
}
