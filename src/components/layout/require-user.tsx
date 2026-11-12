"use client";

import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container, EmptyState, Skeleton } from "@/components/ui/primitives";
import { useCurrentUser } from "@/features/app/hooks";
import { loaders, useAppState } from "@/features/app/store";
import type { Profile } from "@/types";
import { useT } from "@/i18n/client";

export function PageSkeleton() {
  return (
    <Container className="pt-10" aria-busy="true">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="aspect-[3/4]" />
        ))}
      </div>
    </Container>
  );
}

export function LoadError({ onRetry }: { onRetry: () => void }) {
  const t = useT();
  return (
    <Container className="py-16">
      <EmptyState
        title={t.requireUser.loadErrorTitle}
        description={t.requireUser.loadErrorText}
        action={<Button onClick={onRetry}>{t.common.tryAgain}</Button>}
      />
    </Container>
  );
}

/**
 * Renders children with the signed-in profile once the user's data has loaded,
 * a skeleton while loading, or a sign-in prompt when signed out.
 */
export function RequireUser({
  children,
  message,
}: {
  children: (user: Profile) => ReactNode;
  message?: string;
}) {
  const t = useT();
  const state = useAppState();
  const user = useCurrentUser();
  const boot = state.loads.bootstrap;

  if (!state.authReady) return <PageSkeleton />;
  if (!state.currentUserId) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<Lock />}
          title={t.requireUser.signedOutTitle}
          description={message ?? t.requireUser.defaultMessage}
          action={<ButtonLink href="/sign-in">{t.common.signIn}</ButtonLink>}
        />
      </Container>
    );
  }
  if (boot === "error") return <LoadError onRetry={() => void loaders.bootstrap(true)} />;
  if (!user || boot !== "ready") return <PageSkeleton />;
  return <>{children(user)}</>;
}
