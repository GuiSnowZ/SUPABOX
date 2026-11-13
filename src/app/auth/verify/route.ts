import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/email/verification";
import { getAdminSupabase } from "@/lib/supabase/admin";

/** GET /auth/verify?token=… — the link in the confirmation email. */
export async function GET(request: NextRequest) {
  const admin = getAdminSupabase();
  let status = "invalid";
  if (admin) {
    try {
      status = await verifyToken(admin, request.nextUrl.searchParams.get("token") ?? "");
    } catch (e) {
      console.error("[verify]", e instanceof Error ? e.message : e);
      status = "error";
    }
  }
  return NextResponse.redirect(new URL(`/email-confirmed?status=${status}`, request.nextUrl.origin));
}
