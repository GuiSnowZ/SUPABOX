"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";

/**
 * Modal dialog built on the native <dialog> element (focus trap, Escape and
 * screen-reader semantics for free). On phones it opens as a bottom sheet.
 * Mark a field with `data-autofocus` to focus it when the dialog opens.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const t = useT();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      // React's autoFocus runs before the dialog opens, so focus the marked field here.
      d.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-labelledby={titleId}
      className={cn(
        "mx-auto mt-auto mb-0 max-h-[88dvh] w-full max-w-none overflow-hidden rounded-t-2xl border border-border bg-bg-subtle p-0 text-fg",
        "backdrop:bg-black/70 backdrop:backdrop-blur-sm",
        "sm:m-auto sm:w-[min(92vw,32rem)] sm:rounded-2xl",
        className,
      )}
    >
      {open ? (
        <div className="flex max-h-[88dvh] flex-col">
          <div className="flex items-start gap-3 border-b border-border px-5 pt-5 pb-4">
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                {title}
              </h2>
              {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.common.close}
              className="-mt-1 -mr-1 rounded-lg p-1.5 text-faint hover:bg-surface hover:text-fg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {children}
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
