"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { startStore } from "@/features/app/store";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Starts the auth listener and data store once on the client. */
export function StoreStarter() {
  useEffect(() => startStore(), []);
  if (isSupabaseConfigured) return null;
  return (
    <div role="alert" className="border-b border-star/30 bg-star/10 px-4 py-2 text-center text-xs text-star">
      <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px" />
      Supabase isn&apos;t configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local
      and restart the dev server.
    </div>
  );
}
