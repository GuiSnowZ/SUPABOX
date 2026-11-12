"use client";

import { ArrowRight } from "lucide-react";
import { GameCarousel } from "@/components/lists/game-carousel";
import { LogoMark } from "@/components/layout/logo";
import { RequireUser } from "@/components/layout/require-user";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import type { Game } from "@/types";

/**
 * First stop after a new account is activated: the welcome message, then a
 * carousel of all-time classics to rate, review or save right away.
 */
export function WelcomeView({ classics }: { classics: Game[] }) {
  return (
    <RequireUser message="Sign in to start your diary.">
      {(user) => (
        <Container className="max-w-2xl pt-10 pb-6 sm:pt-14">
          <div className="text-center">
            <LogoMark className="mx-auto h-12 w-12" />
            <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">Welcome to Supabox!</h1>
            <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted">
              Thank you for joining our community! We hope you enjoy discovering, rating, and sharing your favorite games!
            </p>
            <p className="mt-2 text-sm text-faint">Good to have you here, {user.displayName.split(" ")[0]}.</p>
          </div>

          {classics.length ? (
            <section aria-labelledby="classics-heading" className="mt-10 rounded-2xl border border-border bg-bg-subtle px-4 pt-6 pb-5 sm:px-8">
              <h2 id="classics-heading" className="text-center text-lg font-semibold">Start with the classics</h2>
              <p className="mt-1 mb-6 text-center text-sm text-muted">
                Some of the greatest games ever made. Played one? Rate it. Want to? Save it. Swipe for more.
              </p>
              <GameCarousel games={classics} />
            </section>
          ) : null}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/profile" size="lg">
              Go to my profile <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/games" size="lg" variant="secondary">
              Browse games
            </ButtonLink>
          </div>
        </Container>
      )}
    </RequireUser>
  );
}
