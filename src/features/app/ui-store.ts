"use client";

/** Transient UI state: toasts and app-wide dialogs (sign-in prompt, review prompt, quick add). */
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
  /** Game just marked Completed: the "rate and review it" dialog is open for it. */
  reviewPromptGameId: string | null;
  /** The quick-add ("+") dialog is open. */
  quickAddOpen: boolean;
}

const initial: UIState = { toasts: [], authPrompt: null, reviewPromptGameId: null, quickAddOpen: false };
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

export function openReviewPrompt(gameId: string) {
  set({ ...state, reviewPromptGameId: gameId });
}

export function closeReviewPrompt() {
  set({ ...state, reviewPromptGameId: null });
}

export function openQuickAdd() {
  set({ ...state, quickAddOpen: true });
}

export function closeQuickAdd() {
  set({ ...state, quickAddOpen: false });
}
