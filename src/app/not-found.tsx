import { Ghost } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container, EmptyState } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <Container className="py-16">
      <EmptyState
        icon={<Ghost />}
        title="Page not found"
        description="This page doesn't exist, or it might be private."
        action={<ButtonLink href="/games">Browse games</ButtonLink>}
      />
    </Container>
  );
}
