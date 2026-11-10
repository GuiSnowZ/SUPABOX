"use client";

import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container, EmptyState, Skeleton } from "@/components/ui/primitives";
import { useCurrentUser } from "@/features/app/hooks";
import { loaders, useAppState } from "@/features/app/store";
import type { Profile } from "@/types";

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
  return (
    <Container className="py-16">
      <EmptyState
        title="Couldn't load this page"
        description="Check your connection and try again."
        action={<Button onClick={onRetry}>Try again</Button>}
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
  message = "Sign in to see this page.",
}: {
  children: (user: Profile) => ReactNode;
  message?: string;
}) {
  const state = useAppState();
  const user = useCurrentUser();
  const boot = state.loads.bootstrap;

  if (!state.authReady) return <PageSkeleton />;
  if (!state.currentUserId) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<Lock />}
          title="You're signed out"
          description={message}
          action={<ButtonLink href="/sign-in">Sign in</ButtonLink>}
        />
      </Container>
    );
  }
  if (boot === "error") return <LoadError onRetry={() => void loaders.bootstrap(true)} />;
  if (!user || boot !== "ready") return <PageSkeleton />;
  return <>{children(user)}</>;
}
