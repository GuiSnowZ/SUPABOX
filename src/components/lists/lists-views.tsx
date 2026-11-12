"use client";

import { Globe, ListPlus, Lock, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LoadError,
  PageSkeleton,
  RequireUser,
} from "@/components/layout/require-user";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import {
  Badge,
  Container,
  EmptyState,
  PageHeader,
  SectionHeader,
  Skeleton,
} from "@/components/ui/primitives";
import {
  getListGames,
  getListsByUser,
  getProfileById,
  getPublicLists,
} from "@/features/app/selectors";
import { canViewList } from "@/features/app/state";
import { actions, loaders, useAppState, useLoad } from "@/features/app/store";
import { toast } from "@/features/app/ui-store";
import { formatDate } from "@/lib/utils";
import { ListCard, ListGrid } from "./list-card";
import { ListEditor } from "./list-editor";
import { useLocale, useT } from "@/i18n/client";
import { ListGameGrid } from "./list-game-grid";
import { Comments } from "@/components/social/comments";
import { LikeButton } from "@/components/social/like-button";
import { GameRoulette } from "./game-roulette";
import { OfficialListCard } from "./official-list-card";
import { LogoMark } from "@/components/layout/logo";
import type { OfficialListSummary } from "@/lib/official-lists/server";
import type { ListCategory } from "@/lib/official-lists/ranking";
import type { Game } from "@/types";

const CATEGORY_ORDER: ListCategory[] = [
  "rankings",
  "platforms",
  "companies",
  "genres",
  "special",
];

/** Official lists grouped by category, with the community lists below. */
function OfficialLists({ lists }: { lists: OfficialListSummary[] }) {
  const t = useT();
  if (!lists.length) return null;
  return (
    <section aria-labelledby="official-heading" className="space-y-10">
      <div>
        <h2
          id="official-heading"
          className="flex items-center gap-2 text-xl font-semibold tracking-tight"
        >
          <LogoMark className="h-6 w-6" /> {t.lists.official}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {t.lists.officialHint}
        </p>
      </div>
      {CATEGORY_ORDER.map((cat) => {
        const group = lists.filter((l) => l.category === cat);
        if (!group.length) return null;
        return (
          <div key={cat}>
            <SectionHeader title={t.lists.categories[cat]} count={group.length} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((l) => (
                <OfficialListCard key={l.slug} list={l} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

export function ListsDiscover({
  official = [],
  classics = [],
}: {
  official?: OfficialListSummary[];
  classics?: Game[];
}) {
  const t = useT();
  const state = useAppState();
  const booting = state.loads.bootstrap !== "ready";
  const publicLists = getPublicLists(state);
  const featured = publicLists.filter((l) => l.featured);
  const recent = publicLists.slice(0, 6);
  const mine = state.currentUserId
    ? getListsByUser(state, state.currentUserId, state.currentUserId)
    : [];

  return (
    <Container>
      <PageHeader
        title={t.lists.title}
        description={t.lists.description}
        actions={
          <ButtonLink href="/lists/new">
            <ListPlus className="h-4 w-4" /> {t.lists.newList}
          </ButtonLink>
        }
      />
      <div className="space-y-14">
        <GameRoulette classics={classics} />
        <OfficialLists lists={official} />
        <h2 className="-mb-6 text-xl font-semibold tracking-tight">
          {t.lists.community}
        </h2>
        {featured.length ? (
          <section aria-labelledby="featured-heading">
            <SectionHeader id="featured-heading" title={t.lists.featured} />
            <p className="-mt-2 mb-5 text-xs text-faint">
              {t.lists.featuredHint}
            </p>
            <ListGrid>
              {featured.map((l) => (
                <ListCard key={l.id} list={l} />
              ))}
            </ListGrid>
          </section>
        ) : null}
        <section aria-labelledby="recent-lists-heading">
          <SectionHeader id="recent-lists-heading" title={t.lists.recent} />
          {booting ? (
            <ListGrid>
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </ListGrid>
          ) : recent.length ? (
            <ListGrid>
              {recent.map((l) => (
                <ListCard key={l.id} list={l} />
              ))}
            </ListGrid>
          ) : (
            <EmptyState
              icon={<ListPlus />}
              title={t.lists.none}
              description={t.lists.noneHint}
              action={<ButtonLink href="/lists/new">{t.lists.create}</ButtonLink>}
            />
          )}
        </section>
        {state.currentUserId && !booting ? (
          <section aria-labelledby="my-lists-heading">
            <SectionHeader
              id="my-lists-heading"
              title={t.lists.mine}
              count={mine.length}
            />
            {mine.length ? (
              <ListGrid>
                {mine.map((l) => (
                  <ListCard key={l.id} list={l} />
                ))}
              </ListGrid>
            ) : (
              <EmptyState
                icon={<ListPlus />}
                title={t.lists.noneMine}
                description={t.lists.noneMineHint}
                action={
                  <ButtonLink href="/lists/new">{t.lists.create}</ButtonLink>
                }
              />
            )}
          </section>
        ) : null}
      </div>
    </Container>
  );
}

export function ListDetail({ id }: { id: string }) {
  const t = useT();
  const locale = useLocale();
  const state = useAppState();
  const status = useLoad(`list:${id}`, () => loaders.list(id));
  const router = useRouter();
  const list = state.lists.find((l) => l.id === id);

  if (status === "error" && !list)
    return <LoadError onRetry={() => void loaders.list(id)} />;
  if (!list && status !== "ready") {
    return (
      <Container className="pt-10">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      </Container>
    );
  }

  if (!list || !canViewList(list, state.currentUserId)) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<Lock />}
          title={t.lists.notFound}
          description={t.lists.notFoundHint}
          action={<ButtonLink href="/lists">{t.lists.browse}</ButtonLink>}
        />
      </Container>
    );
  }

  const author = getProfileById(state, list.userId);
  const games = getListGames(state, list);
  const isOwner = list.userId === state.currentUserId;

  return (
    <Container>
      <nav aria-label="Breadcrumb" className="pt-6 text-sm text-muted">
        <Link href="/lists" className="hover:text-fg">
          {t.lists.title}
        </Link>
      </nav>
      <header className="flex flex-col gap-5 pt-4 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <div className="mb-2 flex items-center gap-2">
            {list.visibility === "private" ? (
              <Badge>
                <Lock className="h-3 w-3" /> {t.lists.private}
              </Badge>
            ) : (
              <Badge>
                <Globe className="h-3 w-3" /> {t.lists.public}
              </Badge>
            )}
            {list.featured ? <Badge tone="accent">{t.lists.featuredBadge}</Badge> : null}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {list.title}
          </h1>
          {author ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted">
              <Link
                href={`/users/${author.username}`}
                className="inline-flex items-center gap-2 hover:text-fg"
              >
                <Avatar profile={author} size="xs" />
                <span className="font-medium text-fg">
                  {author.displayName}
                </span>
              </Link>
              <span className="text-faint">
                · {t.common.games(games.length)} ·{" "}
                {t.lists.updated(formatDate(list.updatedAt, locale))}
              </span>
            </p>
          ) : null}
          {list.description ? (
            <p className="mt-4 leading-relaxed text-muted">
              {list.description}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1">
          <LikeButton
            kind="list"
            targetId={list.id}
            count={list.likeCount ?? 0}
            size="md"
          />
          {isOwner ? (
            <>
              <ButtonLink
                href={`/lists/${list.id}/edit`}
                variant="secondary"
                size="sm"
              >
                <Pencil className="h-3.5 w-3.5" /> {t.lists.edit}
              </ButtonLink>
              <ConfirmButton
                prompt={t.lists.deleteThis}
                onConfirm={async () => {
                  const r = await actions.deleteList(list.id);
                  if (!r.ok) return toast(r.error, "error");
                  toast(t.lists.deleted);
                  router.push("/lists");
                }}
              >
                <Trash2 className="h-3.5 w-3.5" /> {t.common.delete}
              </ConfirmButton>
            </>
          ) : null}
        </div>
      </header>
      {games.length ? (
        <ListGameGrid
          title={list.title}
          entries={games.map((game) => ({ game }))}
        />
      ) : (
        <EmptyState
          title={t.lists.empty}
          description={isOwner ? t.lists.emptyOwner : undefined}
        />
      )}
      {list.visibility === "public" || isOwner ? (
        <div className="mt-14">
          <Comments kind="list" targetId={list.id} ownerId={list.userId} />
        </div>
      ) : null}
    </Container>
  );
}

export function NewList() {
  const t = useT();
  return (
    <RequireUser message={t.lists.newSignIn}>
      {() => (
        <Container>
          <PageHeader
            title={t.lists.newList}
            description={t.lists.newHint}
          />
          <ListEditor />
        </Container>
      )}
    </RequireUser>
  );
}

export function EditList({ id }: { id: string }) {
  const t = useT();
  const state = useAppState();
  const status = useLoad(`list:${id}`, () => loaders.list(id));
  const list = state.lists.find((l) => l.id === id);
  if (!list && status !== "ready" && status !== "error")
    return <PageSkeleton />;
  return (
    <RequireUser message={t.lists.editSignIn}>
      {(user) =>
        !list || list.userId !== user.id ? (
          <Container className="py-16">
            <EmptyState
              title={t.lists.cantEdit}
              description={t.lists.cantEditHint}
            />
          </Container>
        ) : (
          <Container>
            <PageHeader title={t.lists.editTitle} />
            <ListEditor existing={list} />
          </Container>
        )
      }
    </RequireUser>
  );
}
