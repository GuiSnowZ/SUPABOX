import { Gamepad2, PenLine } from "lucide-react";
import type { Metadata } from "next";
import { MedalArt } from "@/components/profiles/medals";
import { Container, PageHeader, SectionHeader } from "@/components/ui/primitives";
import { MEDAL_TIERS } from "@/lib/medals";

export const metadata: Metadata = {
  title: "Medals",
  description: "How Supabox medals work: nine tiers for writing reviews and finishing games, from Brass to Legendary.",
};

const TRACKS = [
  {
    icon: PenLine,
    title: "Critic",
    unit: ["review", "reviews"],
    text: "Counts the reviews you've written (a star rating with some words). Ratings without text don't count.",
  },
  {
    icon: Gamepad2,
    title: "Completionist",
    unit: ["game completed", "games completed"],
    text: "Counts the games in your library marked as Completed.",
  },
] as const;

export default function MedalsPage() {
  return (
    <Container className="max-w-4xl">
      <PageHeader
        title="Medals"
        description="Medals celebrate what you play and what you write. They're earned automatically and shown on your profile — no points, no purchases."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {TRACKS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-[var(--radius-card)] border border-border bg-bg-subtle p-5">
            <Icon className="h-6 w-6 text-accent" />
            <h2 className="mt-3 text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
          </div>
        ))}
      </div>

      <section aria-labelledby="tiers-heading" className="mt-14">
        <SectionHeader id="tiers-heading" title="The nine tiers" />
        <p className="-mt-1 mb-6 text-sm text-muted">
          Both tracks use the same tiers. Reach the number to earn the medal — for example, 25 reviews makes you a{" "}
          <span style={{ color: MEDAL_TIERS[3].color }}>Gold Critic</span>.
        </p>
        <ol className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {MEDAL_TIERS.map((t) => (
            <li
              key={t.level}
              className="flex flex-col items-center rounded-[var(--radius-card)] border border-border bg-bg-subtle px-3 pt-5 pb-4 text-center"
            >
              <MedalArt tier={t} size={112} />
              <p className="mt-3 text-xs font-medium tracking-wide text-faint uppercase">Tier {t.level}</p>
              <h3 className="text-lg font-semibold" style={{ color: t.color }}>
                {t.name}
              </h3>
              <p className="mt-1 text-sm text-muted">
                {t.threshold} {t.threshold === 1 ? "review" : "reviews"} · {t.threshold} {t.threshold === 1 ? "game" : "games"}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="faq-heading" className="mt-14 max-w-2xl">
        <SectionHeader id="faq-heading" title="Good to know" />
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
          <li>Your profile shows your highest medal in each track and how many more you need for the next one.</li>
          <li>Medals follow your diary: if you delete a review or remove a completed game, the count goes down with it.</li>
          <li>Everyone&apos;s medals are visible on their public profile.</li>
        </ul>
      </section>
    </Container>
  );
}
