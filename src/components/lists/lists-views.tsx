"use client";

import { Globe, ListPlus, Lock, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GameCard, GameGrid } from "@/components/games/game-card";
import { LoadError, PageSkeleton, RequireUser } from "@/components/layout/require-user";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Badge, Container, EmptyState, PageHeader, SectionHeader, Skeleton } from "@/components/ui/primitives";
import { getListGames, getListsByUser, getProfileById, getPublicLists } from "@/features/app/selectors";
import { canViewList } from "@/features/app/state";
import { actions, loaders, useAppState, useLoad } from "@/features/app/store";
import { toast } from "@/features/app/ui-store";
import { formatDate, pluralize } from "@/lib/utils";
import { ListCard, ListGrid } from "./list-card";
import { ListEditor } from "./list-editor";

export function ListsDiscover() {
  const state = useAppState();
  const booting = state.loads.bootstrap !== "ready";
  const publicLists = getPublicLists(state);
  const featured = publicLists.filter((l) => l.featured);
  const recent = publicLists.slice(0, 6);
  const mine = state.currentUserId ? getListsByUser(state, state.currentUserId, state.currentUserId) : [];

  return (
    <Container>
      <PageHeader
        title="Lists"
        description="Curated collections from the community — ranked favorites, themed picks and hidden gems."
        actions={
          <ButtonLink href="/lists/new">
            <ListPlus className="h-4 w-4" /> New list
          </ButtonLink>
        }
      />
      <div className="space-y-14">
        {featured.length ? (
          <section aria-labelledby="featured-heading">
            <SectionHeader id="featured-heading" title="Featured Lists" />
            <p className="-mt-2 mb-5 text-xs text-faint">Hand-picked by the Supabox team.</p>
            <ListGrid>
              {featured.map((l) => (
                <ListCard key={l.id} list={l} />
              ))}
            </ListGrid>
          </section>
        ) : null}
        <section aria-labelledby="recent-lists-heading">
          <SectionHeader id="recent-lists-heading" title="Recently Created" />
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
              title="No lists yet"
              description="Be the first to share a list with the community."
              action={<ButtonLink href="/lists/new">Create a list</ButtonLink>}
            />
          )}
        </section>
        {state.currentUserId && !booting ? (
          <section aria-labelledby="my-lists-heading">
            <SectionHeader id="my-lists-heading" title="My Lists" count={mine.length} />
            {mine.length ? (
              <ListGrid>
                {mine.map((l) => (
                  <ListCard key={l.id} list={l} />
                ))}
              </ListGrid>
            ) : (
              <EmptyState
                icon={<ListPlus />}
                title="You haven't made a list yet"
                description="Best horror games? Childhood favorites? Start one in seconds."
                action={<ButtonLink href="/lists/new">Create a list</ButtonLink>}
              />
            )}
          </section>
        ) : null}
      </div>
    </Container>
  );
}

export function ListDetail({ id }: { id: string }) {
  const state = useAppState();
  const status = useLoad(`list:${id}`, () => loaders.list(id));
  const router = useRouter();
  const list = state.lists.find((l) => l.id === id);

  if (status === "error" && !list) return <LoadError onRetry={() => void loaders.list(id)} />;
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
          title="List not found"
          description="This list doesn't exist, or it's private."
          action={<ButtonLink href="/lists">Browse lists</ButtonLink>}
        />
      </Container>
    );
  }

  const author = getProfileById(state, list.userId);
  const games = getListGames(list);
  const isOwner = list.userId === state.currentUserId;

  return (
    <Container>
      <nav aria-label="Breadcrumb" className="pt-6 text-sm text-muted">
        <Link href="/lists" className="hover:text-fg">
          Lists
        </Link>
      </nav>
      <header className="flex flex-col gap-5 pt-4 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <div className="mb-2 flex items-center gap-2">
            {list.visibility === "private" ? (
              <Badge>
                <Lock className="h-3 w-3" /> Private
              </Badge>
            ) : (
              <Badge>
                <Globe className="h-3 w-3" /> Public
              </Badge>
            )}
            {list.featured ? <Badge tone="accent">Featured</Badge> : null}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{list.title}</h1>
          {author ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted">
              <Link href={`/users/${author.username}`} className="inline-flex items-center gap-2 hover:text-fg">
                <Avatar profile={author} size="xs" />
                <span className="font-medium text-fg">{author.displayName}</span>
              </Link>
              <span className="text-faint">
                · {pluralize(games.length, "game")} · updated {formatDate(list.updatedAt)}
              </span>
            </p>
          ) : null}
          {list.description ? <p className="mt-4 leading-relaxed text-muted">{list.description}</p> : null}
        </div>
        {isOwner ? (
          <div className="flex shrink-0 items-center gap-1">
            <ButtonLink href={`/lists/${list.id}/edit`} variant="secondary" size="sm">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </ButtonLink>
            <ConfirmButton
              prompt="Delete this list?"
              onConfirm={async () => {
                const r = await actions.deleteList(list.id);
                if (!r.ok) return toast(r.error, "error");
                toast("List deleted");
                router.push("/lists");
              }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </ConfirmButton>
          </div>
        ) : null}
      </header>
      {games.length ? (
        <GameGrid>
          {games.map((g, i) => (
            <div key={g.id} className="relative">
              <span className="absolute top-2 left-2 z-10 rounded-md bg-black/65 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-white backdrop-blur">
                {i + 1}
              </span>
              <GameCard game={g} />
            </div>
          ))}
        </GameGrid>
      ) : (
        <EmptyState title="This list is empty" description={isOwner ? "Edit the list to add games." : undefined} />
      )}
    </Container>
  );
}

export function NewList() {
  return (
    <RequireUser message="Sign in to create lists.">
      {() => (
        <Container>
          <PageHeader title="New list" description="Lists can include any game — not only ones in your library." />
          <ListEditor />
        </Container>
      )}
    </RequireUser>
  );
}

export function EditList({ id }: { id: string }) {
  const state = useAppState();
  const status = useLoad(`list:${id}`, () => loaders.list(id));
  const list = state.lists.find((l) => l.id === id);
  if (!list && status !== "ready" && status !== "error") return <PageSkeleton />;
  return (
    <RequireUser message="Sign in to edit your lists.">
      {(user) =>
        !list || list.userId !== user.id ? (
          <Container className="py-16">
            <EmptyState title="You can't edit this list" description="Only the list's creator can edit it." />
          </Container>
        ) : (
          <Container>
            <PageHeader title="Edit list" />
            <ListEditor existing={list} />
          </Container>
        )
      }
    </RequireUser>
  );
}
