import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/route-auth";
import { TENANT_ID } from "@/lib/api-constants";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// GET /api/notifications — fetch the current user's 50 most recent notifications
export async function GET(_request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, href, metadata, unread, created_at")
    .eq("recipient_user_id", auth.user.id)
    .eq("tenant_id", TENANT_ID)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data ?? [] });
}

// PATCH /api/notifications — mark one or all notifications as read
// Body: { id: string } to mark one, or { all: true } to mark all
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));

  let query = supabase
    .from("notifications")
    .update({ unread: false })
    .eq("recipient_user_id", auth.user.id)
    .eq("tenant_id", TENANT_ID);

  if (body.id) {
    query = query.eq("id", body.id);
  } else if (!body.all) {
    return NextResponse.json({ error: "Provide id or all:true" }, { status: 400 });
  }

  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
