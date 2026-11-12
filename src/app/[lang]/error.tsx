"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, EmptyState } from "@/components/ui/primitives";
import { useT } from "@/i18n/client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  return (
    <Container className="py-16">
      <EmptyState
        icon={<AlertTriangle />}
        title={t.errorPage.title}
        description={
          <>
            {t.errorPage.text}
            {error.digest ? (
              <span className="mt-2 block text-xs text-faint">
                {t.errorPage.errorId} {error.digest}
              </span>
            ) : null}
          </>
        }
        action={<Button onClick={reset}>{t.common.tryAgain}</Button>}
      />
    </Container>
  );
}
