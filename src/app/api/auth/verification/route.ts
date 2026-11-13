import { type NextRequest, NextResponse } from "next/server";
import { sendVerification, type VerificationRow } from "@/lib/email/verification";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Only accounts this new can start the confirmation flow (older ones count as confirmed). */
const START_WINDOW_MS = 60 * 60_000;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

/**
 * POST /api/auth/verification { action: "start" | "resend" | "change", email? }
 * For the signed-in user: start the confirmation email right after sign-up,
 * send it again, or fix a mistyped address (which sends to the new one).
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  const db = await createSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: "Unavailable right now." }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as { action?: string; email?: string };
  const { data: row } = await admin.from("email_verifications").select("*").eq("user_id", user.id).maybeSingle<VerificationRow>();
  const meta = (user.user_metadata ?? {}) as { locale?: string; display_name?: string };
  let email = user.email;

  if (body.action === "start") {
    if (row) return NextResponse.json({ status: row.status, email: row.email });
    if (Date.now() - Date.parse(user.created_at) > START_WINDOW_MS) return NextResponse.json({ status: "verified", email });
  } else if (body.action === "resend") {
    if (!row || row.status === "verified") return NextResponse.json({ status: "verified", email });
  } else if (body.action === "change") {
    if (!row || row.status === "verified") return NextResponse.json({ error: "Your email is already confirmed." }, { status: 400 });
    const next = (body.email ?? "").trim().toLowerCase();
    if (!EMAIL.test(next)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (next !== email) {
      // The account email is changed directly: it's unconfirmed anyway, and the
      // confirmation link below goes to the new address.
      const { error } = await admin.auth.admin.updateUserById(user.id, { email: next, email_confirm: true });
      if (error) {
        const taken = /already|registered|exists/i.test(error.message);
        return NextResponse.json({ error: taken ? "An account with this email already exists." : "Couldn't change the email. Try again." }, { status: 400 });
      }
      email = next;
    }
  } else {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const result = await sendVerification(
      admin,
      { id: user.id, email, locale: meta.locale ?? "pt-BR", name: meta.display_name ?? "" },
      { force: body.action === "change" },
    );
    const { data: after } = await admin.from("email_verifications").select("status, email, sent_at").eq("user_id", user.id).maybeSingle();
    return NextResponse.json({ result, status: after?.status ?? result, email: after?.email ?? email, sentAt: after?.sent_at ?? null });
  } catch (e) {
    console.error("[verification]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Couldn't send the email right now. Try again later." }, { status: 502 });
  }
}
