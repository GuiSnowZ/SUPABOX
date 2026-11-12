"use client";

import { Ghost } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container, EmptyState } from "@/components/ui/primitives";
import { useT } from "@/i18n/client";

export default function NotFound() {
  const t = useT();
  return (
    <Container className="py-16">
      <EmptyState
        icon={<Ghost />}
        title={t.notFound.title}
        description={t.notFound.text}
        action={<ButtonLink href="/games">{t.notFound.browse}</ButtonLink>}
      />
    </Container>
  );
}
