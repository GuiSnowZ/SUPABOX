"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { RequireUser } from "@/components/layout/require-user";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Textarea } from "@/components/ui/form";
import { Container, PageHeader, SectionHeader } from "@/components/ui/primitives";
import { signOut } from "@/features/app/auth";
import { checkAvatarFile, removeAvatar, type SquareCrop, uploadAvatar } from "@/features/app/avatar";
import { AvatarCropper } from "./avatar-cropper";
import { actions } from "@/features/app/store";
import { toast } from "@/features/app/ui-store";
import type { Profile } from "@/types";
import { useT } from "@/i18n/client";

/** Upload, change or remove the profile picture. Saves immediately (separate from the form). */
function AvatarPicker({ user }: { user: Profile }) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<"upload" | "remove" | null>(null);
  const [chosen, setChosen] = useState<{ file: File; url: string } | null>(null);

  function closeEditor() {
    if (chosen) URL.revokeObjectURL(chosen.url);
    setChosen(null);
  }

  function onFile(file: File | undefined) {
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    const invalid = checkAvatarFile(file);
    if (invalid) return toast(invalid, "error");
    if (chosen) URL.revokeObjectURL(chosen.url);
    setChosen({ file, url: URL.createObjectURL(file) }); // opens the crop editor
  }

  async function save(crop: SquareCrop) {
    if (!chosen) return;
    setPending("upload");
    const r = await uploadAvatar(chosen.file, crop);
    setPending(null);
    if (r.ok) closeEditor();
    toast(r.ok ? t.editProfile.photoUpdated : r.error, r.ok ? "default" : "error");
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        <Avatar profile={user} size="lg" />
        {pending ? (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
            <Loader2 className="h-5 w-5 animate-spin" />
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          id="avatar-file"
          onChange={(e) => onFile(e.target.files?.[0])}
          disabled={Boolean(pending)}
        />
        <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()} disabled={Boolean(pending)}>
          <Camera className="h-4 w-4" /> {user.avatarUrl ? t.editProfile.changePhoto : t.editProfile.uploadPhoto}
        </Button>
        {user.avatarUrl ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={Boolean(pending)}
            onClick={async () => {
              setPending("remove");
              const r = await removeAvatar();
              setPending(null);
              toast(r.ok ? t.editProfile.photoRemoved : r.error, r.ok ? "default" : "error");
            }}
          >
            {t.editProfile.remove}
          </Button>
        ) : null}
        <p className="w-full text-xs text-faint">{t.editProfile.photoHint}</p>
      </div>
      {chosen ? (
        <AvatarCropper key={chosen.url} url={chosen.url} saving={pending === "upload"} onCancel={closeEditor} onConfirm={save} />
      ) : null}
    </div>
  );
}

function Form({ user }: { user: Profile }) {
  const t = useT();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const r = await actions.updateProfile({ displayName, bio });
    if (!r.ok) return setError(r.error);
    toast(t.editProfile.updated);
    router.push("/profile");
  }

  return (
    <form onSubmit={submit} className="max-w-lg space-y-5" noValidate>
      <AvatarPicker user={{ ...user, displayName: displayName || user.displayName }} />
      <Field label={t.editProfile.displayName} htmlFor="displayName">
        <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={50} />
      </Field>
      <Field label={t.editProfile.username} htmlFor="username" hint={t.editProfile.usernameHint}>
        <Input id="username" value={`@${user.username}`} disabled />
      </Field>
      <Field label={t.editProfile.bio} htmlFor="bio" hint={`${bio.length}/300`}>
        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} />
      </Field>
      <FormError>{error}</FormError>
      <div className="flex gap-2">
        <Button type="submit">{t.common.save}</Button>
        <Button variant="ghost" onClick={() => router.back()}>
          {t.common.cancel}
        </Button>
      </div>
    </form>
  );
}

/** LGPD/GDPR self-service: download all your data, or delete your account. */
function YourData({ user }: { user: Profile }) {
  const t = useT();
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const matches = confirm.trim().toLowerCase() === user.username.toLowerCase();

  async function deleteAccount(e: FormEvent) {
    e.preventDefault();
    if (!matches) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? t.editProfile.deleteFailed);
      await signOut();
      toast(t.editProfile.deleted);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.editProfile.deleteFailed);
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="your-data-heading" className="mt-14 max-w-lg">
      <SectionHeader id="your-data-heading" title={t.editProfile.yourData} />
      <p className="text-sm text-muted">
        {t.editProfile.dataIntro}{" "}
        <Link href="/privacy" className="text-accent hover:underline">
          {t.editProfile.privacyPolicy}
        </Link>
        .
      </p>
      <a
        href="/api/account/export"
        download
        className="mt-4 inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-hover"
      >
        {t.editProfile.download}
      </a>

      <form onSubmit={deleteAccount} className="mt-8 rounded-[var(--radius-card)] border border-danger/30 p-4">
        <p className="font-medium text-danger">{t.editProfile.deleteTitle}</p>
        <p className="mt-1 text-sm text-muted">{t.editProfile.deleteText}</p>
        <Field label={t.editProfile.confirmLabel(user.username)} htmlFor="confirm-delete">
          <Input
            id="confirm-delete"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="off"
            className="mt-1"
          />
        </Field>
        <FormError>{error}</FormError>
        <Button type="submit" variant="danger" className="mt-3" disabled={!matches || pending}>
          {pending ? t.editProfile.deleting : t.editProfile.deleteButton}
        </Button>
      </form>
    </section>
  );
}

export function EditProfile() {
  const t = useT();
  return (
    <RequireUser message={t.editProfile.signIn}>
      {(user) => (
        <Container>
          <PageHeader title={t.editProfile.title} />
          <Form key={user.id} user={user} />
          <YourData user={user} />
        </Container>
      )}
    </RequireUser>
  );
}
