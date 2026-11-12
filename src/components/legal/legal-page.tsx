import type { ReactNode } from "react";
import { Container } from "@/components/ui/primitives";

export const LEGAL_CONTACT = "privacy@supaboxd.com";
export const LEGAL_OPERATOR = "Guilherme Rodrigues";

/** Shared layout for the Privacy Policy and Terms of Service. */
export function LegalPage({
  title,
  updated,
  updatedLabel = "Last updated:",
  children,
}: {
  title: string;
  updated: string;
  updatedLabel?: string;
  children: ReactNode;
}) {
  return (
    <Container className="max-w-3xl py-10">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-faint">
        {updatedLabel} {updated}
      </p>
      <div className="mt-8 space-y-4 leading-relaxed text-fg/85 [&_a]:text-accent [&_a]:underline-offset-2 hover:[&_a]:underline [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-fg [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
        {children}
      </div>
    </Container>
  );
}
