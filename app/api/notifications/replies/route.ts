import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/route-auth";
import { TENANT_ID } from "@/lib/api-constants";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// POST /api/notifications/replies
// Creates a reply notification for the original message author.
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const { authorName, entityId, entityType, messageId, replyContent, quotedPreview, replierName } =
    body as {
      authorName?: string;
      entityId?: string;
      entityType?: string;
      messageId?: string;
      replyContent?: string;
      quotedPreview?: string;
      replierName?: string;
    };

  if (!authorName || !entityId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const surface = entityType === "task" ? "task" : "lead";
  const href =
    surface === "lead"
      ? `/leads?leadId=${entityId}${messageId ? `&messageId=${messageId}` : ""}`
      : `/tasks?taskId=${entityId}${messageId ? `&messageId=${messageId}` : ""}`;

  // Look up the original message author by display name
  const { data: authorRows } = await supabase
    .from("staff")
    .select("user_id, first_name, last_name")
    .eq("tenant_id", TENANT_ID)
    .limit(50);

  const authorRow = authorRows?.find(
    (s) => `${s.first_name} ${s.last_name}`.trim() === authorName,
  );

  if (!authorRow?.user_id) {
    return NextResponse.json({ queued: 0 });
  }

  // Don't notify if the replier is the original author
  if (authorRow.user_id === auth.user.id) {
    return NextResponse.json({ queued: 0 });
  }

  const actorName = replierName ?? "Someone";
  const surfaceLabel = surface === "lead" ? "lead chat" : "task chat";

  const deepLink = {
    surface,
    surfaceId: entityId,
    messageId: messageId ?? "",
  };

  const preview = (replyContent ?? "").slice(0, 50);

  const { error } = await supabase.from("notifications").insert({
    tenant_id: TENANT_ID,
    recipient_user_id: authorRow.user_id,
    type: "reply",
    title: `${actorName} replied to your message`,
    href,
    metadata: {
      actorName,
      actorInitials: actorName
        .split(" ")
        .map((p: string) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      senderName: actorName,
      messagePreview: preview,
      quotedPreview: (quotedPreview ?? "").slice(0, 50),
      surfaceLabel,
      entityId,
      entityType: surface,
      messageId: messageId ?? null,
      body: `"${preview}" · ${surfaceLabel}`,
      deepLink,
    },
    unread: true,
  });

  if (error) {
    console.error("reply notification insert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ queued: 1 });
}
