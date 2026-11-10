"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { RequireUser } from "@/components/layout/require-user";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Textarea } from "@/components/ui/form";
import { Container, PageHeader } from "@/components/ui/primitives";
import { actions } from "@/features/app/store";
import { toast } from "@/features/app/ui-store";
import type { Profile } from "@/types";

function Form({ user }: { user: Profile }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const r = await actions.updateProfile({ displayName, bio });
    if (!r.ok) return setError(r.error);
    toast("Profile updated");
    router.push("/profile");
  }

  return (
    <form onSubmit={submit} className="max-w-lg space-y-5" noValidate>
      <div className="flex items-center gap-4">
        <Avatar profile={{ ...user, displayName: displayName || user.displayName }} size="lg" />
        <p className="text-sm text-muted">Photo uploads are coming soon.</p>
      </div>
      <Field label="Display name" htmlFor="displayName">
        <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={50} />
      </Field>
      <Field label="Username" htmlFor="username" hint="Usernames can't be changed yet.">
        <Input id="username" value={`@${user.username}`} disabled />
      </Field>
      <Field label="Bio" htmlFor="bio" hint={`${bio.length}/300`}>
        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} />
      </Field>
      <FormError>{error}</FormError>
      <div className="flex gap-2">
        <Button type="submit">Save</Button>
        <Button variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function EditProfile() {
  return (
    <RequireUser message="Sign in to edit your profile.">
      {(user) => (
        <Container>
          <PageHeader title="Edit profile" />
          <Form key={user.id} user={user} />
        </Container>
      )}
    </RequireUser>
  );
}
