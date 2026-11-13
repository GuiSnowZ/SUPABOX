import { CheckCircle2, XCircle } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Container, EmptyState } from "@/components/ui/primitives";
import { getT } from "@/i18n/server";

type Props = PageProps<"/[lang]/email-confirmed">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { t } = await getT(params);
  return { title: t.verify.pageTitle, robots: { index: false, follow: false } };
}

async function Result({ params, searchParams }: Props) {
  const { t } = await getT(params);
  const status = (await searchParams).status;
  const ok = status === "verified";
  const title = ok ? t.verify.verified : status === "expired" ? t.verify.expired : t.verify.invalid;
  const hint = ok ? t.verify.verifiedHint : status === "expired" ? t.verify.expiredHint : t.verify.invalidHint;
  return (
    <Container className="max-w-xl py-16">
      <EmptyState
        icon={ok ? <CheckCircle2 className="text-accent" /> : <XCircle />}
        title={title}
        description={hint}
        action={<ButtonLink href={ok ? "/" : "/sign-in"}>{ok ? t.verify.goHome : t.common.signIn}</ButtonLink>}
      />
    </Container>
  );
}

/** Where the confirmation link lands (/auth/verify redirects here with ?status=). */
export default function EmailConfirmedPage(props: Props) {
  return (
    <Suspense fallback={null}>
      <Result {...props} />
    </Suspense>
  );
}
