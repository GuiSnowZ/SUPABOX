import { Gamepad2, PenLine } from "lucide-react";
import type { Metadata } from "next";
import { alternatesFor } from "@/lib/seo/meta";
import { MedalArt } from "@/components/profiles/medals";
import { Container, PageHeader, SectionHeader } from "@/components/ui/primitives";
import { getT } from "@/i18n/server";
import { MEDAL_TIERS } from "@/lib/medals";

export async function generateMetadata({ params }: PageProps<"/[lang]/medals">): Promise<Metadata> {
  const { t, locale } = await getT(params);
  return { alternates: alternatesFor("/medals", locale), title: t.medals.title, description: t.medals.metaDescription };
}

export default async function MedalsPage({ params }: PageProps<"/[lang]/medals">) {
  const { t } = await getT(params);
  const tracks = [
    { icon: PenLine, title: t.medals.critic, text: t.medals.criticText },
    { icon: Gamepad2, title: t.medals.completionist, text: t.medals.completionistText },
  ];
  return (
    <Container className="max-w-4xl">
      <PageHeader title={t.medals.title} description={t.medals.pageDescription} />

      <div className="grid gap-4 sm:grid-cols-2">
        {tracks.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-[var(--radius-card)] border border-border bg-bg-subtle p-5">
            <Icon className="h-6 w-6 text-accent" />
            <h2 className="mt-3 text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
          </div>
        ))}
      </div>

      <section aria-labelledby="tiers-heading" className="mt-14">
        <SectionHeader id="tiers-heading" title={t.medals.nineTiers} />
        <p className="-mt-1 mb-6 text-sm text-muted">
          {t.medals.tiersIntroBefore} <span style={{ color: MEDAL_TIERS[3].color }}>{t.medals.goldCritic}</span>.
        </p>
        <ol className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {MEDAL_TIERS.map((tier) => (
            <li
              key={tier.level}
              className="flex flex-col items-center rounded-[var(--radius-card)] border border-border bg-bg-subtle px-3 pt-5 pb-4 text-center"
            >
              <MedalArt tier={tier} size={112} />
              <p className="mt-3 text-xs font-medium tracking-wide text-faint uppercase">{t.medals.tier(tier.level)}</p>
              <h3 className="text-lg font-semibold" style={{ color: tier.color }}>
                {t.medals.tiers[tier.level - 1]}
              </h3>
              <p className="mt-1 text-sm text-muted">{t.medals.thresholds(tier.threshold)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="faq-heading" className="mt-14 max-w-2xl">
        <SectionHeader id="faq-heading" title={t.medals.goodToKnow} />
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
          <li>{t.medals.faq1}</li>
          <li>{t.medals.faq2}</li>
          <li>{t.medals.faq3}</li>
        </ul>
      </section>
    </Container>
  );
}
