"use client";

import { MailCheck } from "lucide-react";
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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setPending(true);
    setError(null);
    try {
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Something went wrong.");
      return r.ok;
    } catch {
      setError("Couldn't reach Supabox. Check your connection and try again.");
      return false;
    } finally {
      setPending(false);
    }
  }
  return { pending, error, run, setError };
}

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { pending, error, run } = useSubmit();
  const linkError = params.get("error");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (await run(() => signIn(email, password))) {
      toast("Welcome back!");
      router.push("/");
    }
  }

  return (
    <Shell
      title="Sign in"
      subtitle="Welcome back to your gaming diary."
      footer={
        <>
          New to Supabox?{" "}
          <Link href="/sign-up" className="font-medium text-accent hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {linkError && !error ? <FormError>{linkError}</FormError> : null}
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="password">
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
            Forgot password?
          </Link>
        </div>
        <FormError>{error}</FormError>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </Shell>
  );
}

export function SignUpForm() {
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
      toast("Welcome to Supabox!");
      router.push("/profile");
    }
  }

  if (sentTo) {
    return (
      <Shell title="Check your email" subtitle="One more step to finish creating your account.">
        <Notice title="Confirmation link sent">
          We sent a link to <span className="text-fg">{sentTo}</span>. Open it on this device to activate your account.
        </Notice>
      </Shell>
    );
  }

  return (
    <Shell
      title="Create your account"
      subtitle="Start tracking the games that make your story."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="Username"
          htmlFor="username"
          hint={
            usernameValid ? (
              <>Your profile will live at /users/{form.username || "username"}.</>
            ) : (
              <span className="text-danger">3–30 characters: lowercase letters, numbers and underscores.</span>
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
        <Field label="Display name" htmlFor="displayName" hint="Optional. You can change it later.">
          <Input id="displayName" autoComplete="nickname" maxLength={50} value={form.displayName} onChange={set("displayName")} />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" required value={form.email} onChange={set("email")} />
        </Field>
        <Field label="Password" htmlFor="password" hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}>
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
          {pending ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-center text-xs text-faint">
          By creating an account you agree to the{" "}
          <Link href="/terms" className="text-muted underline-offset-2 hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-muted underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </Shell>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const { pending, error, run } = useSubmit();

  return (
    <Shell
      title="Reset your password"
      subtitle="We'll email you a link to choose a new password."
      footer={
        <Link href="/sign-in" className="font-medium text-accent hover:underline">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <Notice title="Check your email">
          If an account exists for <span className="text-fg">{email}</span>, a reset link is on its way.
        </Notice>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (await run(() => requestPasswordReset(email))) setSent(true);
          }}
          className="space-y-4"
        >
          <Field label="Email" htmlFor="email">
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <FormError>{error}</FormError>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </Shell>
  );
}

export function UpdatePasswordForm() {
  const router = useRouter();
  const state = useAppState();
  const [password, setPassword] = useState("");
  const { pending, error, run } = useSubmit();

  if (!state.authReady) {
    return (
      <Shell title="Choose a new password" subtitle="Loading…">
        <Skeleton className="h-24 w-full" />
      </Shell>
    );
  }
  if (!state.currentUserId) {
    return (
      <Shell title="Choose a new password" subtitle="Your reset link has expired or was opened on another device.">
        <ButtonLink href="/forgot-password" className="w-full">
          Request a new link
        </ButtonLink>
      </Shell>
    );
  }

  return (
    <Shell title="Choose a new password" subtitle="Pick something you don't use anywhere else.">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (await run(() => updatePassword(password))) {
            toast("Password updated");
            router.push("/profile");
          }
        }}
        className="space-y-4"
      >
        <Field label="New password" htmlFor="password" hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}>
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
          {pending ? "Saving…" : "Save password"}
        </Button>
      </form>
    </Shell>
  );
}
