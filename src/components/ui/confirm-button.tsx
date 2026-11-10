"use client";

import { useState, type ReactNode } from "react";
import { Button } from "./button";

/** Two-step destructive action: first click asks, second confirms. */
export function ConfirmButton({
  onConfirm,
  children,
  confirmLabel = "Delete",
  prompt = "Are you sure?",
  size = "sm",
}: {
  onConfirm: () => void;
  children: ReactNode;
  confirmLabel?: string;
  prompt?: string;
  size?: "sm" | "md";
}) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <Button variant="ghost" size={size} onClick={() => setAsking(true)}>
        {children}
      </Button>
    );
  }
  return (
    <span className="inline-flex items-center gap-2" role="group" aria-label={prompt}>
      <span className="text-xs text-muted">{prompt}</span>
      <Button
        variant="danger"
        size="sm"
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
        autoFocus
      >
        {confirmLabel}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setAsking(false)}>
        Cancel
      </Button>
    </span>
  );
}
