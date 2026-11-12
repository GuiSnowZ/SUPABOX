"use client";

import type { ComponentProps, ReactNode } from "react";
import { useLocale } from "@/i18n/client";
import { translateMessage } from "@/i18n/errors";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-lg border border-border bg-bg-subtle px-3 text-sm text-fg placeholder:text-faint transition-colors hover:border-border-strong focus:border-accent focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-accent/25";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(field, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(field, "min-h-28 py-2.5 leading-relaxed", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(field, "h-10 cursor-pointer pr-8", className)} {...props} />;
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-fg", className)} {...props} />;
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-faint">{hint}</p> : null}
    </div>
  );
}

export function Checkbox({ label, className, ...props }: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2 text-sm text-muted", className)}>
      <input type="checkbox" className="h-4 w-4 cursor-pointer accent-[var(--color-accent)]" {...props} />
      {label}
    </label>
  );
}

/** Error message for a form. Plain-text messages from the logic layer are shown in the page's language. */
export function FormError({ children }: { children: ReactNode }) {
  const locale = useLocale();
  if (!children) return null;
  return (
    <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
      {typeof children === "string" ? translateMessage(children, locale) : children}
    </p>
  );
}
