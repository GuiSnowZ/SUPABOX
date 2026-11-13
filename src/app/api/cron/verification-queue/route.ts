import { NextResponse } from "next/server";
import { processQueue } from "@/lib/email/verification";
import { getAdminSupabase } from "@/lib/supabase/admin";

/**
 * GET /api/cron/verification-queue — runs daily (vercel.json): sends queued
 * confirmation emails while the day's email budget lasts. Safe to call
 * anytime: it only sends emails that are already waiting, within the budget.
 */
export async function GET() {
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: "Unavailable." }, { status: 503 });
  try {
    return NextResponse.json(await processQueue(admin), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[verification-queue]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Queue failed." }, { status: 500 });
  }
}
