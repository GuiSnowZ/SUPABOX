"use client";

import { useState, type ReactNode } from "react";
import { Button } from "./button";
import { useT } from "@/i18n/client";

/** Two-step destructive action: first click asks, second confirms. */
export function ConfirmButton({
  onConfirm,
  children,
  confirmLabel,
  prompt,
  size = "sm",
}: {
  onConfirm: () => void;
  children: ReactNode;
  confirmLabel?: string;
  prompt?: string;
  size?: "sm" | "md";
}) {
  const t = useT();
  const [asking, setAsking] = useState(false);
  const ask = prompt ?? t.common.areYouSure;
  if (!asking) {
    return (
      <Button variant="ghost" size={size} onClick={() => setAsking(true)}>
        {children}
      </Button>
    );
  }
  return (
    <span className="inline-flex items-center gap-2" role="group" aria-label={ask}>
      <span className="text-xs text-muted">{ask}</span>
      <Button
        variant="danger"
        size="sm"
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
        autoFocus
      >
        {confirmLabel ?? t.common.delete}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setAsking(false)}>
        {t.common.cancel}
      </Button>
    </span>
  );
}
