import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/route-auth";
import { TENANT_ID } from "@/lib/api-constants";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const { mentionedStaffIds, leadId, leadRef, message } = body as {
    mentionedStaffIds?: string[];
    leadId?: string;
    leadRef?: string;
    message?: string;
  };

  if (!Array.isArray(mentionedStaffIds) || !leadId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Resolve staff.id → staff.user_id for each mentioned person
  const { data: staffRows } = await supabase
    .from("staff")
    .select("id, user_id, first_name, last_name")
    .in("id", mentionedStaffIds)
    .eq("tenant_id", TENANT_ID);

  if (!staffRows || staffRows.length === 0) {
    return NextResponse.json({ queued: 0 });
  }

  // Look up the sender's staff row so we can exclude them and label the notification
  const senderUserId = auth.user.id;
  const { data: senderRow } = await supabase
    .from("staff")
    .select("first_name, last_name")
    .eq("user_id", senderUserId)
    .eq("tenant_id", TENANT_ID)
    .single();

  const senderName = senderRow
    ? `${senderRow.first_name} ${senderRow.last_name}`.trim()
    : "Someone";

  // Build one notification row per recipient (skip sender, skip rows with no user_id)
  const rows = staffRows
    .filter((s) => s.user_id && s.user_id !== senderUserId)
    .map((s) => ({
      tenant_id: TENANT_ID,
      recipient_user_id: s.user_id,
      type: "mention",
      title: `${senderName} mentioned you in ${leadRef ?? leadId}`,
      href: `/leads?leadId=${leadId}`,
      metadata: {
        senderName,
        leadId,
        leadRef,
        snippet: message?.slice(0, 120) ?? "",
      },
      unread: true,
    }));

  if (rows.length === 0) {
    return NextResponse.json({ queued: 0 });
  }

  const { error } = await supabase.from("notifications").insert(rows);
  if (error) {
    console.error("notifications insert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ queued: rows.length });
}
