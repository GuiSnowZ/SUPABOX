"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-[var(--radius-card)] border border-border bg-bg-subtle", className)} {...props} />;
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: ComponentProps<"span"> & { tone?: "neutral" | "accent" | "info" | "warning" | "danger" }) {
  const tones = {
    neutral: "bg-surface text-muted border-border",
    accent: "bg-accent/12 text-accent border-accent/30",
    info: "bg-info/12 text-info border-info/30",
    warning: "bg-star/12 text-star border-star/30",
    danger: "bg-danger/12 text-danger border-danger/30",
  };
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium", tones[tone], className)}
      {...props}
    />
  );
}

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[var(--container-page)] px-4 sm:px-6 lg:px-8", className)} {...props} />;
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 pt-8 pb-6 sm:flex-row sm:items-end sm:justify-between sm:pt-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm text-muted sm:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionHeader({
  title,
  href,
  linkLabel,
  count,
  id,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  count?: number;
  id?: string;
}) {
  const t = useT();
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-border pb-2">
      <h2 id={id} className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
        {title}
        {count !== undefined ? <span className="ml-2 text-faint">{count}</span> : null}
      </h2>
      {href ? (
        <Link href={href} className="text-xs font-medium text-muted transition-colors hover:text-accent">
          {linkLabel ?? t.common.seeAll}
        </Link>
      ) : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-border px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? <div className="mb-3 text-faint [&_svg]:h-8 [&_svg]:w-8">{icon}</div> : null}
      <p className="font-medium text-fg">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-skeleton rounded-md bg-surface", className)} />;
}
