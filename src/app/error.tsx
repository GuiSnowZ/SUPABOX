"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, EmptyState } from "@/components/ui/primitives";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container className="py-16">
      <EmptyState
        icon={<AlertTriangle />}
        title="Something went wrong"
        description={
          <>
            We couldn&apos;t load this page. Please try again.
            {error.digest ? <span className="mt-2 block text-xs text-faint">Error ID: {error.digest}</span> : null}
          </>
        }
        action={<Button onClick={reset}>Try again</Button>}
      />
    </Container>
  );
}
