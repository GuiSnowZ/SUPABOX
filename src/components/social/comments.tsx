"use client";

import { MessageCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useId, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { FormError, Textarea } from "@/components/ui/form";
import { SectionHeader, Skeleton } from "@/components/ui/primitives";
import { type CommentItem, deleteComment, friendlyError, loadComments, postComment } from "@/features/app/db";
import { getProfileById } from "@/features/app/selectors";
import { adjustCommentCount, registerProfiles, useAppState } from "@/features/app/store";
import { promptSignIn, toast } from "@/features/app/ui-store";
import { getSupabase } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils";
import type { ID } from "@/types";
import { useLocale, useT } from "@/i18n/client";

const MAX_COMMENT = 1000;

/**
 * Comments under a review or list. The author of a comment and the owner of
 * the review/list can delete it (the database enforces the same rule).
 */
export function Comments({ kind, targetId, ownerId }: { kind: "review" | "list"; targetId: ID; ownerId: ID }) {
  const t = useT();
  const locale = useLocale();
  const state = useAppState();
  const me = state.currentUserId;
  const [comments, setComments] = useState<CommentItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const inputId = useId();

  useEffect(() => {
    let alive = true;
    loadComments(getSupabase(), kind, targetId)
      .then(({ comments, profiles }) => {
        if (!alive) return;
        registerProfiles(profiles);
        setComments(comments);
      })
      .catch((e) => alive && setLoadError(friendlyError(e)));
    return () => {
      alive = false;
    };
  }, [kind, targetId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!me) return promptSignIn(t.social.signInComment);
    const text = body.trim();
    if (!text) return;
    setPending(true);
    setError(null);
    try {
      const c = await postComment(getSupabase(), kind, targetId, me, text);
      setComments((list) => [...(list ?? []), c]);
      adjustCommentCount(kind, targetId, 1);
      setBody("");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setPending(false);
    }
  }

  async function remove(id: ID) {
    try {
      await deleteComment(getSupabase(), id);
      setComments((list) => (list ?? []).filter((c) => c.id !== id));
      adjustCommentCount(kind, targetId, -1);
    } catch (err) {
      toast(friendlyError(err), "error");
    }
  }

  return (
    <section aria-labelledby={`${inputId}-heading`} className="max-w-2xl">
      <SectionHeader id={`${inputId}-heading`} title={t.social.comments} count={comments?.length} />
      {loadError ? (
        <p className="text-sm text-danger">{t.social.loadCommentsError(loadError)}</p>
      ) : comments === null ? (
        <Skeleton className="h-20 w-full" />
      ) : comments.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <MessageCircle className="h-4 w-4" /> {t.social.noComments}
        </p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => {
            const author = getProfileById(state, c.userId);
            const canDelete = me !== null && (me === c.userId || me === ownerId);
            return (
              <li key={c.id} className="flex gap-3">
                {author ? (
                  <Link href={`/users/${author.username}`} className="shrink-0" aria-label={author.displayName}>
                    <Avatar profile={author} size="sm" />
                  </Link>
                ) : (
                  <span className="h-8 w-8 shrink-0 rounded-full bg-surface" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    {author ? (
                      <Link href={`/users/${author.username}`} className="font-medium text-fg hover:text-accent">
                        {author.displayName}
                      </Link>
                    ) : (
                      <span className="font-medium text-muted">{t.social.someone}</span>
                    )}{" "}
                    <time dateTime={c.createdAt} className="text-xs text-faint">
                      {timeAgo(c.createdAt, locale)}
                    </time>
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed break-words whitespace-pre-line text-fg/90">{c.body}</p>
                </div>
                {canDelete ? (
                  <ConfirmButton prompt={t.social.deleteComment} onConfirm={() => remove(c.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only">{t.social.deleteCommentLabel}</span>
                  </ConfirmButton>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={submit} className="mt-6 space-y-2">
        <label htmlFor={inputId} className="sr-only">
          {t.social.writeComment}
        </label>
        <Textarea
          id={inputId}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onFocus={() => state.authReady && !me && promptSignIn(t.social.signInComment)}
          placeholder={me ? t.social.writePlaceholder : t.social.signInPlaceholder}
          maxLength={MAX_COMMENT}
          rows={2}
          className="min-h-16"
        />
        <FormError>{error}</FormError>
        <div className="flex items-center justify-between">
          <span className="text-xs text-faint tabular-nums">
            {body.length}/{MAX_COMMENT}
          </span>
          <Button type="submit" size="sm" disabled={pending || !body.trim()}>
            {pending ? t.social.posting : t.social.post}
          </Button>
        </div>
      </form>
    </section>
  );
}
