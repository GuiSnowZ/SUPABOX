"use client";

import type { ReactNode } from "react";
import { Info, Users } from "lucide-react";
import { DiscoveryGrid } from "@/components/home/discovery-row";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container, EmptyState, PageHeader } from "@/components/ui/primitives";
import { GameGridSkeleton } from "@/components/games/game-card";
import { useForYou, useFriendsActivity } from "@/features/app/discovery";
import { promptSignIn } from "@/features/app/ui-store";
import { useAppState } from "@/features/app/store";
import type { Game } from "@/types";
import { useT } from "@/i18n/client";

const LIMIT = 48;

function Note({ children }: { children: ReactNode }) {
  return (
    <p className="-mt-4 mb-8 flex max-w-3xl items-start gap-1.5 text-xs text-faint">
      <Info className="mt-px h-3.5 w-3.5 shrink-0" /> <span>{children}</span>
    </p>
  );
}

/** /games/for-you */
export function ForYouView({ picks }: { picks: Game[] }) {
  const t = useT();
  const state = useAppState();
  const { status, items, personalized } = useForYou(picks, LIMIT);
  const d = t.discover.forYou;
  return (
    <Container>
      <PageHeader title={d.title} description={d.description} />
      <Note>{personalized ? d.how : state.currentUserId ? d.fallback : d.signedOut}</Note>
      {!state.currentUserId && state.authReady ? (
        <Button className="mb-8" onClick={() => promptSignIn(d.signedOut)}>
          {t.common.signIn}
        </Button>
      ) : null}
      {status === "loading" ? <GameGridSkeleton /> : status === "error" ? <p className="text-sm text-muted">{t.discover.loadError}</p> : <DiscoveryGrid items={items} />}
    </Container>
  );
}

/** /games/friends */
export function FriendsView() {
  const t = useT();
  const { status, items } = useFriendsActivity(LIMIT);
  const d = t.discover.friends;
  return (
    <Container>
      <PageHeader title={d.title} description={d.description} />
      {status === "loading" ? (
        <GameGridSkeleton />
      ) : status === "error" ? (
        <p className="text-sm text-muted">{t.discover.loadError}</p>
      ) : status === "signed-out" ? (
        <EmptyState icon={<Users />} title={d.signIn} action={<Button onClick={() => promptSignIn(d.signIn)}>{t.common.signIn}</Button>} />
      ) : status === "no-follows" ? (
        <EmptyState
          icon={<Users />}
          title={d.noFollows}
          description={d.noFollowsHint}
          action={
            <ButtonLink href="/reviews" variant="secondary">
              {d.findPeople}
            </ButtonLink>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState icon={<Users />} title={d.noActivity} />
      ) : (
        <DiscoveryGrid items={items} />
      )}
    </Container>
  );
}
