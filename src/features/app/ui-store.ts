"use client";

/** Transient UI state: toasts and the sign-in prompt dialog. */
import { useSyncExternalStore } from "react";

export interface Toast {
  id: number;
  message: string;
  tone: "default" | "error";
}

interface UIState {
  toasts: Toast[];
  /** When set, the sign-in prompt dialog is open with this reason. */
  authPrompt: string | null;
}

const initial: UIState = { toasts: [], authPrompt: null };
let state = initial;
let nextId = 1;
const listeners = new Set<() => void>();

function set(next: UIState) {
  state = next;
  listeners.forEach((l) => l());
}

export function useUI(): UIState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => initial,
  );
}

export function toast(message: string, tone: Toast["tone"] = "default") {
  const id = nextId++;
  set({ ...state, toasts: [...state.toasts, { id, message, tone }].slice(-3) });
  setTimeout(() => dismissToast(id), 3200);
}

export function dismissToast(id: number) {
  set({ ...state, toasts: state.toasts.filter((t) => t.id !== id) });
}

export function promptSignIn(reason: string) {
  set({ ...state, authPrompt: reason });
}

export function closeSignInPrompt() {
  set({ ...state, authPrompt: null });
}
