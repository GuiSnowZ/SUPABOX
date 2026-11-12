import { type NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/account/delete { "confirm": "<username>" }
 * Permanently deletes the signed-in user's account. Deleting the auth user
 * cascades to their profile and everything they created (see the schema's
 * ON DELETE CASCADE rules); profile pictures are removed from Storage first. Requires the same-origin request and the username
 * typed as confirmation.
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  }
  const db = await createSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to delete your account." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { confirm?: string };
  const { data: profile } = await db.from("profiles").select("username").eq("id", user.id).maybeSingle();
  if (!profile || (body.confirm ?? "").trim().toLowerCase() !== String(profile.username).toLowerCase()) {
    return NextResponse.json({ error: "Type your username exactly to confirm." }, { status: 400 });
  }

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: "Account deletion is unavailable right now." }, { status: 503 });
  // Profile pictures live in Storage, outside the database cascade: remove them first.
  const { data: files } = await admin.storage.from("avatars").list(user.id, { limit: 100 });
  if (files?.length) {
    const { error: removeError } = await admin.storage.from("avatars").remove(files.map((f) => `${user.id}/${f.name}`));
    if (removeError) console.error("[account/delete] avatar cleanup", removeError.message);
  }
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[account/delete]", error.message);
    return NextResponse.json({ error: "Couldn't delete your account. Please try again." }, { status: 500 });
  }
  await db.auth.signOut();
  return NextResponse.json({ ok: true });
}
