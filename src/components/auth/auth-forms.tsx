"use client";

import { MailCheck } from "lucide-react";
import { verificationAction } from "@/features/app/email-verification";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, type ReactNode, useState } from "react";
import { LogoMark } from "@/components/layout/logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, FormError, Input } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/primitives";
import {
  MIN_PASSWORD_LENGTH,
  requestPasswordReset,
  signIn,
  signUp,
  updatePassword,
  USERNAME_PATTERN,
} from "@/features/app/auth";
import { useAppState } from "@/features/app/store";
import { toast } from "@/features/app/ui-store";
import { useT } from "@/i18n/client";

function Shell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-sm px-4 py-14 sm:py-20">
      <LogoMark className="h-10 w-10" />
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
      <div className="mt-8">{children}</div>
      {footer ? <div className="mt-8 text-center text-sm text-muted">{footer}</div> : null}
    </div>
  );
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div role="status" className="rounded-xl border border-accent/30 bg-accent/8 p-5 text-sm">
      <MailCheck className="h-6 w-6 text-accent" />
      <p className="mt-3 font-medium text-fg">{title}</p>
      <div className="mt-1 text-muted">{children}</div>
    </div>
  );
}

/** Small hook for async form submission state. */
function useSubmit() {
  const t = useT();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setPending(true);
    setError(null);
    try {
      const r = await fn();
      if (!r.ok) setError(r.error ?? t.auth.unexpected);
      return r.ok;
    } catch {
      setError(t.auth.unreachable);
      return false;
    } finally {
      setPending(false);
    }
  }
  return { pending, error, run, setError };
}

export function SignInForm() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { pending, error, run } = useSubmit();
  const linkError = params.get("error");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (await run(() => signIn(email, password))) {
      toast(t.auth.welcomeBack);
      router.push("/");
    }
  }

  return (
    <Shell
      title={t.auth.signInTitle}
      subtitle={t.auth.signInSubtitle}
      footer={
        <>
          {t.auth.newHere}{" "}
          <Link href="/sign-up" className="font-medium text-accent hover:underline">
            {t.auth.createAccountLink}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {linkError && !error ? <FormError>{linkError}</FormError> : null}
        <Field label={t.auth.email} htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label={t.auth.password} htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <div className="text-right">
          <Link href="/forgot-password" className="text-xs text-muted hover:text-fg">
            {t.auth.forgot}
          </Link>
        </div>
        <FormError>{error}</FormError>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t.auth.signingIn : t.auth.signInTitle}
        </Button>
      </form>
    </Shell>
  );
}

export function SignUpForm() {
  const t = useT();
  const router = useRouter();
  const [form, setForm] = useState({ username: "", displayName: "", email: "", password: "" });
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { pending, error, run } = useSubmit();
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: k === "username" ? e.target.value.toLowerCase() : e.target.value }));
  const usernameValid = !form.username || USERNAME_PATTERN.test(form.username);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    let needsConfirmation = false;
    const ok = await run(async () => {
      const r = await signUp(form);
      if (r.ok) needsConfirmation = Boolean(r.needsConfirmation);
      return r;
    });
    if (!ok) return;
    if (needsConfirmation) setSentTo(form.email);
    else {
      // Signed in right away: send (or queue) the confirmation email in the background of the next page.
      await verificationAction("start").catch(() => undefined);
      router.push("/welcome");
    }
  }

  if (sentTo) {
    return (
      <Shell title={t.auth.checkEmailTitle} subtitle={t.auth.checkEmailSubtitle}>
        <Notice title={t.auth.confirmationSent}>
          {t.auth.sentToBefore} <span className="text-fg">{sentTo}</span>
          {t.auth.sentToAfter}
        </Notice>
      </Shell>
    );
  }

  return (
    <Shell
      title={t.auth.signUpTitle}
      subtitle={t.auth.signUpSubtitle}
      footer={
        <>
          {t.auth.haveAccount}{" "}
          <Link href="/sign-in" className="font-medium text-accent hover:underline">
            {t.common.signIn}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label={t.auth.username}
          htmlFor="username"
          hint={
            usernameValid ? (
              <>{t.auth.usernameHint(form.username)}</>
            ) : (
              <span className="text-danger">{t.auth.usernameRule}</span>
            )
          }
        >
          <Input
            id="username"
            autoComplete="username"
            required
            maxLength={30}
            value={form.username}
            onChange={set("username")}
            aria-invalid={!usernameValid}
          />
        </Field>
        <Field label={t.auth.displayName} htmlFor="displayName" hint={t.auth.displayNameHint}>
          <Input id="displayName" autoComplete="nickname" maxLength={50} value={form.displayName} onChange={set("displayName")} />
        </Field>
        <Field label={t.auth.email} htmlFor="email">
          <Input id="email" type="email" autoComplete="email" required value={form.email} onChange={set("email")} />
        </Field>
        <Field label={t.auth.password} htmlFor="password" hint={t.auth.passwordHint(MIN_PASSWORD_LENGTH)}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={form.password}
            onChange={set("password")}
          />
        </Field>
        <FormError>{error}</FormError>
        <Button type="submit" className="w-full" disabled={pending || !usernameValid}>
          {pending ? t.auth.creating : t.auth.create}
        </Button>
        <p className="text-center text-xs text-faint">
          {t.auth.agreeBefore}{" "}
          <Link href="/terms" className="text-muted underline-offset-2 hover:underline">
            {t.auth.termsLink}
          </Link>{" "}
          {t.auth.and}{" "}
          <Link href="/privacy" className="text-muted underline-offset-2 hover:underline">
            {t.auth.privacyLink}
          </Link>
          .
        </p>
      </form>
    </Shell>
  );
}

export function ForgotPasswordForm() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const { pending, error, run } = useSubmit();

  return (
    <Shell
      title={t.auth.resetTitle}
      subtitle={t.auth.resetSubtitle}
      footer={
        <Link href="/sign-in" className="font-medium text-accent hover:underline">
          {t.auth.backToSignIn}
        </Link>
      }
    >
      {sent ? (
        <Notice title={t.auth.checkEmailTitle}>
          {t.auth.resetSentBefore} <span className="text-fg">{email}</span>
          {t.auth.resetSentAfter}
        </Notice>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (await run(() => requestPasswordReset(email))) setSent(true);
          }}
          className="space-y-4"
        >
          <Field label={t.auth.email} htmlFor="email">
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <FormError>{error}</FormError>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t.auth.sending : t.auth.sendLink}
          </Button>
        </form>
      )}
    </Shell>
  );
}

export function UpdatePasswordForm() {
  const t = useT();
  const router = useRouter();
  const state = useAppState();
  const [password, setPassword] = useState("");
  const { pending, error, run } = useSubmit();

  if (!state.authReady) {
    return (
      <Shell title={t.auth.newPasswordTitle} subtitle={t.common.loading}>
        <Skeleton className="h-24 w-full" />
      </Shell>
    );
  }
  if (!state.currentUserId) {
    return (
      <Shell title={t.auth.newPasswordTitle} subtitle={t.auth.linkExpired}>
        <ButtonLink href="/forgot-password" className="w-full">
          {t.auth.requestNewLink}
        </ButtonLink>
      </Shell>
    );
  }

  return (
    <Shell title={t.auth.newPasswordTitle} subtitle={t.auth.newPasswordSubtitle}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (await run(() => updatePassword(password))) {
            toast(t.auth.passwordUpdated);
            router.push("/profile");
          }
        }}
        className="space-y-4"
      >
        <Field label={t.auth.newPassword} htmlFor="password" hint={t.auth.passwordHint(MIN_PASSWORD_LENGTH)}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <FormError>{error}</FormError>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t.common.saving : t.auth.savePassword}
        </Button>
      </form>
    </Shell>
  );
}
