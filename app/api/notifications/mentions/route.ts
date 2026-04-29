import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/route-auth";

// TODO: When the notifications module is built, deliver in-app + push/email
// notifications to each mentionedStaffId based on their notification settings.
// Body shape: { mentionedStaffIds: string[], leadId: string, leadRef: string, message: string }
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const { mentionedStaffIds, leadId } = body as {
    mentionedStaffIds?: string[];
    leadId?: string;
  };

  if (!Array.isArray(mentionedStaffIds) || !leadId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Placeholder — notifications delivery to be implemented
  return NextResponse.json({ queued: mentionedStaffIds.length });
}
